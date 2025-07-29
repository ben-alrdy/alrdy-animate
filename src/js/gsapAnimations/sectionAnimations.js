function initializeBackgroundColor(element, gsap, ScrollTrigger, duration, ease, scrollStart, scrollEnd, debug = false, scrub) {
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

  // Helper function to check if colors object has valid colors
  function hasValidColors(colors) {
    return Object.keys(colors).length > 0;
  }

  // Helper function to set colors with GSAP
  function setColors(target, colors) {
    if (hasValidColors(colors)) {
      gsap.set(target, colors);
    }
  }

  // Get the wrapper's initial colors from computed styles
  const wrapperStyle = getComputedStyle(element);
  const wrapperInitialColors = {
    backgroundColor: wrapperStyle.backgroundColor,
    color: wrapperStyle.color
  };

  // Get and store all sections with their colors
  const sections = Array.from(element.querySelectorAll('[aa-wrapper-colors]')).map((section, i) => {
    const sectionColors = parseColors(section.getAttribute('aa-wrapper-colors'));
    
    // Get items from children AND the section itself if it has aa-item-colors
    const childItems = Array.from(section.querySelectorAll('[aa-item-colors]')).map(item => {
      const itemColors = parseColors(item.getAttribute('aa-item-colors'));
      
      return {
        element: item,
        colors: itemColors
      };
    });

    // Check if the section itself has aa-item-colors
    const sectionItemColors = parseColors(section.getAttribute('aa-item-colors'));
    let sectionItem = null;
    if (hasValidColors(sectionItemColors)) {
      sectionItem = {
        element: section,
        colors: sectionItemColors
      };
    }

    return {
      element: section,
      colors: sectionColors,
      items: sectionItem ? [sectionItem, ...childItems] : childItems
    };
  });

  // Early return if no sections found
  if (sections.length === 0) return;

  // Check initial scroll position and set appropriate colors
  const checkInitialPosition = () => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const triggerPoint = scrollY + viewportHeight * 0.5;
    
    // Find which section should be active based on current scroll position
    let activeSectionIndex = -1;
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const rect = section.element.getBoundingClientRect();
      const triggerTop = rect.top + scrollY;
      const triggerBottom = rect.bottom + scrollY;
      
      // Check if this section should be active (similar to ScrollTrigger logic)
      if (triggerTop <= triggerPoint && triggerBottom >= triggerPoint) {
        activeSectionIndex = i;
        break; // Found the active section, no need to continue
      }
    }
    
    // Set colors based on active section
    if (activeSectionIndex >= 0) {
      const activeSection = sections[activeSectionIndex];
      setColors(element, activeSection.colors);
      
      // Set item colors for active section
      activeSection.items.forEach(item => {
        setColors(item.element, item.colors);
      });
    } else {
      // No active section, use wrapper initial colors
      setColors(element, wrapperInitialColors);
    }
  };

  // Check initial position after a short delay to ensure DOM is ready
  setTimeout(checkInitialPosition, 100);

  // Create a ScrollTrigger for each section
  sections.forEach((section, index) => {
    const prevSection = index > 0 ? sections[index - 1] : null;
    
    if (scrub) {
      const tl = gsap.timeline({
        defaults: { duration: 1, ease: "none" },
        paused: true,
        data: { index }
      });
      
      // Parent animation - only animate if there are colors to animate to
      if (hasValidColors(section.colors)) {
        const fromColors = prevSection ? {
          backgroundColor: prevSection.colors.backgroundColor,
          color: prevSection.colors.color
        } : wrapperInitialColors;
        
        tl.fromTo(element,
          fromColors,
          section.colors,
          0
        );
      }

      // Item animations
      section.items.forEach(item => {
        if (hasValidColors(item.colors)) {
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
        scrub: scrub ? (parseFloat(scrub) || true) : false,
        animation: tl,
        markers: debug,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        preventOverlaps: true
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
      if (hasValidColors(section.colors)) {
        tl.to(element, section.colors);
      }

      section.items.forEach(item => {
        if (hasValidColors(item.colors)) {
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