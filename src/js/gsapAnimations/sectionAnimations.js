function initializeBackgroundColor(element, gsap, ScrollTrigger, duration, ease, scrollStart, scrollEnd, debug = false, scrub) {
  // Helper function to convert rgb to hex
  function rgbToHex(rgb) {
    // Extract r, g, b values from rgb(r, g, b) format
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    
    // Convert to hex and pad with zeros if needed
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Helper function to parse aa-colors attribute
  function parseColors(attribute) {
    if (!attribute) return {};
    
    return attribute.split(';').reduce((colors, current) => {
      const [type, value] = current.split(':').map(s => s.trim());
      if (type === 'bg' || type === 'text') {
        colors[type === 'bg' ? 'backgroundColor' : 'color'] = value;
      }
      return colors;
    }, {});
  }

  // Store and set initial colors (converting to hex)
  const computedStyle = getComputedStyle(element);
  const initialColors = {
    backgroundColor: rgbToHex(computedStyle.backgroundColor),
    color: rgbToHex(computedStyle.color)
  };
  
  // Explicitly set initial colors
  gsap.set(element, initialColors);

  // Get and store all sections with their colors
  const sections = Array.from(element.querySelectorAll('[aa-wrapper-colors]')).map((section, i) => {
    const sectionColors = parseColors(section.getAttribute('aa-wrapper-colors'));
    
    const items = Array.from(section.querySelectorAll('[aa-item-colors]')).map(item => {
      const itemColors = parseColors(item.getAttribute('aa-item-colors'));
      const computedStyle = getComputedStyle(item);
      const initialItemColors = {
        backgroundColor: rgbToHex(computedStyle.backgroundColor),
        color: rgbToHex(computedStyle.color)
      };
      
      return {
        element: item,
        initialColors: initialItemColors,
        colors: itemColors
      };
    });

    return {
      element: section,
      colors: sectionColors,
      items
    };
  });

  // Create a ScrollTrigger for each section
  sections.forEach((section, index) => {
    const prevSection = index > 0 ? sections[index - 1] : null;
    
    if (scrub) {
      // Force initial state globally
      gsap.set(element, initialColors);
      
      const tl = gsap.timeline({
        defaults: { duration: 1, ease: "none" },
        paused: true,
        data: { index }
      });
      
      // Parent animation
      if (Object.keys(section.colors).length > 0) {
        const fromColors = prevSection ? {
          backgroundColor: prevSection.colors.backgroundColor,
          color: prevSection.colors.color
        } : initialColors;
        
        tl.fromTo(element,
          fromColors,
          section.colors,
          0
        );
      }

      // Item animations
      section.items.forEach(item => {
        if (Object.keys(item.colors).length > 0) {
          tl.to(item.element, {
            backgroundColor: item.colors.backgroundColor,
            color: item.colors.color
          }, "<");
        }
      });

      ScrollTrigger.create({
        trigger: section.element,
        start: scrollStart,
        end: scrollEnd,
        scrub: scrub,
        animation: tl,
        markers: debug,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        preventOverlaps: true,
        ...(scrub !== 'snap' && { snap: false }),
        onRefresh: self => {
          // Create a temporary trigger for the wrapper
          const wrapperTrigger = ScrollTrigger.create({
            trigger: element,
            start: "top bottom", // When top of wrapper hits bottom of viewport
          });
          
          const isAboveWrapper = !wrapperTrigger.isActive;
          wrapperTrigger.kill(); // Clean up temporary trigger
          
          // Only reset colors if we're above the wrapper
          if (isAboveWrapper) {
            gsap.set(element, initialColors);
            sections.forEach(section => {
              section.items.forEach(item => {
                gsap.set(item.element, item.initialColors);
              });
            });
          }
        }
      });

      // Store ScrollTrigger ID for reference
      section.element.dataset.stId = `background-${index}`;
    } else {
      // Create a shared timeline for this section
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration, ease }
      });

      // Set up the forward animation
      if (Object.keys(section.colors).length > 0) {
        tl.to(element, section.colors);
      }

      section.items.forEach(item => {
        if (Object.keys(item.colors).length > 0) {
          tl.to(item.element, {
            ...item.colors
          }, "<");
        }
      });

      ScrollTrigger.create({
        trigger: section.element,
        start: scrollStart,
        onEnter: () => {
          tl.play();
        },
        onLeaveBack: () => {
          tl.reverse();
        },
        markers: debug
      });
    }
  });
}

function initializeParallax(element, gsap, ScrollTrigger, scrub, animationType) {
  // Determine target for animation
  const target = element.querySelector('[aa-parallax-target]') || element;

  // Determine animation direction and property
  const isHorizontal = animationType && animationType.includes('horizontal');
  const prop = isHorizontal ? 'xPercent' : 'yPercent';

  // Get scrub value
  const scrubValue = scrub ? parseFloat(scrub) : true;

  // Get the start position in %
  const startAttr = element.getAttribute('aa-parallax-start');
  const startVal = startAttr !== null ? parseFloat(startAttr) : 20;

  // Get the end position in %
  const endAttr = element.getAttribute('aa-parallax-end');
  const endVal = endAttr !== null ? parseFloat(endAttr) : -20;

  // Get the start/end value of the ScrollTrigger
  const scrollStartRaw = element.getAttribute('aa-scroll-start') || 'top bottom';
  const scrollStart = `clamp(${scrollStartRaw})`;
  
  const scrollEndRaw = element.getAttribute('aa-scroll-end') || 'bottom top';
  const scrollEnd = `clamp(${scrollEndRaw})`;

  // Create GSAP animation with ScrollTrigger
  gsap.fromTo(
    target,
    { [prop]: startVal },
    {
      [prop]: endVal,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: scrollStart,
        end: scrollEnd,
        scrub: scrubValue,
      },
    }
  );
}

function initializeClip(element) {
  const triggers = Array.from(element.querySelectorAll('[aa-clip-trigger]'));
  const contents = Array.from(element.querySelectorAll('[aa-clip-content]'));
  const backgrounds = Array.from(element.querySelectorAll('[aa-clip-background]'));
  const count = contents.length;

  const clipStates = {
    vertical: {
      start: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      end: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      initial: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"
    },
    right: {
      start: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      end: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
      initial: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"
    },
    left: {
      start: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      end: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
      initial: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
    }
  };

  triggers.forEach((trigger, i) => {
    const content = contents[i];
    const background = backgrounds[i];
    if (!content) return;

    content.style.zIndex = count - i;

    const direction = content.getAttribute('aa-clip-content') || 'vertical';
    const state = clipStates[direction];
    const nextContent = contents[i + 1];
    const nextDirection = nextContent ? (nextContent.getAttribute('aa-clip-content') || 'vertical') : null;
    const nextState = nextDirection ? clipStates[nextDirection] : null;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: i === 0 ? "top top" : "top bottom",
        end: i === count - 1 ? "bottom bottom" : "bottom top",
        scrub: true
      },
      defaults: { ease: "none" }
    });

    if (i === 0) {
      gsap.set(content, { clipPath: state.start });
      if (nextDirection === direction) {
        tl.to(content, { clipPath: state.end });
      } else if (nextDirection && nextState) {
        // Animate out using the next section's direction
        tl.to(content, { clipPath: nextState.end });
      }
    } else if (i === count - 1) {
      gsap.set(content, { clipPath: state.initial });
      tl.to(content, { clipPath: state.start });
    } else {
      gsap.set(content, { clipPath: state.initial });
      tl.to(content, { clipPath: state.start });
      if (nextDirection === direction) {
        tl.to(content, { clipPath: state.end });
      } else if (nextDirection && nextState) {
        tl.to(content, { clipPath: nextState.end });
      }
    }

    if (background) {
      gsap.timeline({
        scrollTrigger: {
          trigger: trigger,
          start: "top top",
          end: "bottom top",
          scrub: true
        },
        defaults: { ease: "none" }
      }).to(background, { yPercent: 50 });
    }
  });
}

function initializeStack(element, scrub, distance) {
  const triggers = Array.from(element.querySelectorAll('[aa-stack-trigger]'));
  const contents = Array.from(element.querySelectorAll('[aa-stack-content]'));
  const count = contents.length;

  // Set initial states
  contents.forEach((content, i) => {
    gsap.set(content, {
      opacity: 0,
      zIndex: count - i
    });
  });

  triggers.forEach((trigger, i) => {
    const content = contents[i];
    if (!content) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: "top center",
        end: "bottom center",
        scrub: scrub ? (parseFloat(scrub) || true) : false
      }
    });

    // Create a timeline with three parts:
    // 1. First 10%: Fade in
    // 2. Middle 80%: Stay visible
    // 3. Last 10%: Fade out
    tl.fromTo(content,
      { opacity: 0, yPercent: 10*distance },
      { opacity: 1, yPercent: 0, duration: 0.2 },
      0
    ).to(content,
      { opacity: 1, yPercent: 0, duration: 0.6 },
      0.2
    ).to(content,
      { opacity: 0, yPercent: -10*distance, duration: 0.2 },
      0.8
    );
  });
}

function createSectionAnimations(gsap, ScrollTrigger) {
  
  return {
    backgroundColor: (element, duration, ease, scrollStart, scrollEnd, debug, scrub) => {
      initializeBackgroundColor(element, gsap, ScrollTrigger, duration, ease, scrollStart, scrollEnd, debug, scrub);
    },
    
    parallax: (element, scrub, animationType) => {
      initializeParallax(element, gsap, ScrollTrigger, scrub, animationType);
    },
    
    clip: (element) => {
      return initializeClip(element);
    },
    stack: (element, scrub, distance) => {
      return initializeStack(element, scrub, distance);
    }
  };
}

export { createSectionAnimations }; 