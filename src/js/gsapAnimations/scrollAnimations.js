function initializeScrollState() {
  let lastScrollTop = 0;
  const threshold = 20;
  const thresholdTop = 50;

  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      const currentScrollTop = self.scroll();
      
      if (Math.abs(currentScrollTop - lastScrollTop) >= threshold) {
        const direction = currentScrollTop > lastScrollTop ? 'down' : 'up';
        const hasScrolled = currentScrollTop > thresholdTop;
        
        // Update body attributes for global state
        document.body.setAttribute('data-scroll-direction', direction);
        document.body.setAttribute('data-scroll-started', hasScrolled ? 'true' : 'false');
        
        lastScrollTop = currentScrollTop;
      }
    },
    ignoreMobileResize: true,
    invalidateOnRefresh: false
  });
}

function initializeNav(element, type, ease, duration, distance, scrolled) {
  // Track class state to avoid unnecessary DOM operations
  let hasScrolledClass = false;

  // Function to ensure nav is visible at top
  const showNavAtTop = () => {
    gsap.to(element, { y: '0%', duration, ease, overwrite: true });
  };

  // Add function to handle scrolled class
  const updateScrolledClass = (scrollTop) => {
    if (scrollTop >= scrolled && !hasScrolledClass) {
      element.classList.add('is-scrolled');
      hasScrolledClass = true;  
    } else if (scrollTop < scrolled && hasScrolledClass) {
      element.classList.remove('is-scrolled');
      hasScrolledClass = false;
    }
  };

  // Watch for scroll direction changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-scroll-direction') {
        const direction = document.body.getAttribute('data-scroll-direction');
        const scrollTop = window.scrollY;
        
        if (type.includes('hide')) {
          if (direction === 'down') {
            gsap.to(element, { 
              y: `${-100 * distance}%`, 
              duration: duration * 2, 
              ease, 
              overwrite: true 
            });
          } else {
            showNavAtTop();
          }
        }
        
        if (type.includes('change')) {
          updateScrolledClass(scrollTop);
        }
      }
    });
  });

  observer.observe(document.body, { attributes: true });
}

function initializeBackgroundColor(element, gsap, ScrollTrigger, duration, ease, viewportPercentage, debug = false) {
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

  // Get animation settings
  const scrub = element.getAttribute('aa-scrub');
  const scrubValue = scrub === 'smoother' ? 4 :
                     scrub === 'smooth' ? 2 :
                     scrub === 'snap' ? { snap: 0.2 } :
                     scrub ? true : false;

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
        start: `top ${viewportPercentage * 100}%`,
        end: `center ${viewportPercentage * 100}%`,
        scrub: scrubValue,
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
        start: `top ${viewportPercentage * 100}%`,
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

function initializeParallax(element, gsap, ScrollTrigger, scroll = 'smooth') {
  // Get configuration from attributes
  const parts = element.getAttribute('aa-animate').split('-');
  const isHalf = parts.includes('half');
  const isDownward = parts.includes('down');
  const parallaxValue = parts.find(part => !isNaN(parseFloat(part))) || 40;
  
  // Check if parent has overflow:hidden
  const parentStyle = window.getComputedStyle(element.parentElement);
  const hasOverflowHidden = parentStyle.overflow === 'hidden';

  if (hasOverflowHidden) {
    // Calculate required scale based on parallax value
    const scale = 1 + (2 * parallaxValue / element.offsetHeight);
    gsap.set(element, { scale });
  } 
  
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(element, 
    { y: isDownward ? -parallaxValue : parallaxValue },
    { y: isDownward ? parallaxValue : -parallaxValue, ease: "none" }
  );
  
  ScrollTrigger.create({
    trigger: element.parentElement,
    start: "top bottom",
    end: isHalf ? "center center" : "bottom top",
    scrub: scroll.includes('smoother') ? 5 :
           scroll.includes('smooth') ? 2 :
           scroll.includes('snap') ? { snap: 0.2 } : true,
    animation: tl
  });

}

function createAppearTimeline(element, gsap, duration, ease, delay, distance) {
  const [_, direction] = element.getAttribute('aa-animate').split('-');
  
  // Set initial state based on direction
  const initialState = {
    opacity: 0,
    y: direction === 'up' ? 50 * distance : 
       direction === 'down' ? -50 * distance : 0,
    x: direction === 'left' ? 50 * distance : 
       direction === 'right' ? -50 * distance : 0
  };
  
  // Set final state
  const finalState = {
    opacity: 1,
    y: 0,
    x: 0,
    duration,
    ease,
    delay
  };
  
  // Create and return timeline
  const tl = gsap.timeline();
  return tl.fromTo(element, initialState, finalState);
}

function createRevealTimeline(element, gsap, duration, ease, delay) {
  const [_, direction] = element.getAttribute('aa-animate').split('-');
  
  const clipPaths = {
    up: {
      start: 'inset(100% 0 0 0)',
      end: 'inset(0% 0 0 0)'
    },
    down: {
      start: 'inset(0 0 100% 0)',
      end: 'inset(0 0 0% 0)'
    },
    left: {
      start: 'inset(0 100% 0 0)',
      end: 'inset(0 0% 0 0)'
    },
    right: {
      start: 'inset(0 0 0 100%)',
      end: 'inset(0 0 0 0%)'
    },
    center: {
      start: 'circle(0% at 50% 50%)',
      end: 'circle(150% at 50% 50%)'
    }
  };
  
  // Create and return timeline
  const tl = gsap.timeline();
  gsap.set(element, {
    clipPath: clipPaths[direction]?.start || clipPaths.up.start,
    opacity: direction === 'center' ? 0 : 1
  });
  
  return tl.to(element, {
    clipPath: clipPaths[direction]?.end || clipPaths.up.end,
    opacity: 1,
    duration,
    ease,
    delay
  });
}

function createCounterTimeline(element, gsap, duration, ease, delay) {
  const [_, startValue] = element.getAttribute('aa-animate').split('-');
  const originalText = element.textContent;
  
  // Detect format: replace all thousand separators with nothing to get pure number
  const cleanNumber = originalText.replace(/[,\.]/g, '');
  const targetValue = parseFloat(cleanNumber);
  const start = startValue ? parseFloat(startValue) : 0;
  
  // Determine the format (whether using . or , as thousand separator)
  const usesComma = originalText.includes(',');
  const usesDot = originalText.includes('.');
  
  if (isNaN(targetValue)) {
    console.warn('Counter animation target must be a number');
    return gsap.timeline();
  }
  
  // Create and return timeline
  const tl = gsap.timeline();
  return tl.fromTo(element, 
    { 
      textContent: start 
    },
    {
      textContent: targetValue,
      duration,
      ease,
      delay,
      snap: { textContent: 1 },
      onUpdate: function() {
        const value = this.targets()[0].textContent;
        // Format based on original format
        if (usesComma) {
          this.targets()[0].textContent = Number(value).toLocaleString('en-US').replace(/,/g, ',');
        } else if (usesDot) {
          this.targets()[0].textContent = Number(value).toLocaleString('de-DE').replace(/\./g, '.');
        }
      }
    }
  );
}

function createMarqueeTimeline(element, gsap, duration, scrub) {
  // Parse animation settings from aa-animate attribute
  const animateAttr = element.getAttribute('aa-animate');
  const isRightDirection = animateAttr.includes('right');
  const hasHover = animateAttr.includes('hover');
  const isPaused = animateAttr.includes('paused');
  const hasSwitch = animateAttr.includes('switch');
  
  const scrollContainer = element.querySelector('[aa-marquee-scroller]');
  const collection = element.querySelector('[aa-marquee-items]');
  
  if (!scrollContainer || !collection) {
    console.warn('Marquee elements not found. Required: [aa-marquee-scroller] and [aa-marquee-items]');
    return;
  }

  const speedMultiplier = window.innerWidth < 479 ? 0.5 : window.innerWidth < 991 ? 0.75 : 1;
  const scrollSpeed = parseInt(scrollContainer.getAttribute('aa-marquee-scroller')) || 0;
  const baseSpeed = duration * (collection.offsetWidth / window.innerWidth) * speedMultiplier;
  
  const duplicates = parseInt(collection.getAttribute('aa-marquee-items')) || 2;

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < duplicates; i++) {
    fragment.appendChild(collection.cloneNode(true));
  }
  scrollContainer.appendChild(fragment);

  const marqueeItems = element.querySelectorAll('[aa-marquee-items]');
  const directionMultiplier = isRightDirection ? 1 : -1;
  
  // Only create continuous marquee animation if not paused
  if (!isPaused) {
    // Create animation first (always to -100)
    const animation = gsap.to(marqueeItems, {
      xPercent: -100,
      repeat: -1,
      duration: baseSpeed,
      ease: 'linear',
      force3D: true, // Enable hardware acceleration
      willChange: 'transform' // Hint to browser about animation
    }).totalProgress(0.5);

    // Set initial position based on direction
    gsap.set(marqueeItems, { 
      xPercent: directionMultiplier === 1 ? 100 : -100,
      force3D: true,
      willChange: 'transform'
    });
    
    // Control direction with timeScale
    animation.timeScale(directionMultiplier);
    animation.play();

    // Set initial state using class
    element.classList.add('marquee-normal');

    // Only set up direction switching if needed
    if (hasSwitch) {
      // State variables for direction changes
      let isChangingDirection = false;
      let lastDirection = directionMultiplier;
      let currentDirection = directionMultiplier;
      let lastScrollTime = 0;
      const scrollThrottle = 100; // Throttle scroll events to every 100ms

      // Watch for scroll direction changes
      const observer = new MutationObserver((mutations) => {
        const now = Date.now();
        if (now - lastScrollTime < scrollThrottle) return;
        lastScrollTime = now;

        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-scroll-direction') {
            const direction = document.body.getAttribute('data-scroll-direction');
            const isInverted = direction === 'down';
            
            // Update marquee direction based on scroll direction
            currentDirection = isInverted ? -directionMultiplier : directionMultiplier;
            
            if (!isChangingDirection && currentDirection !== lastDirection) {
              isChangingDirection = true;
              lastDirection = currentDirection;

              // Use a single animation for smoother transition
              gsap.to(animation, {
                timeScale: currentDirection,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                  isChangingDirection = false;
                }
              });
            }
            
            element.classList.toggle('marquee-normal', !isInverted);
            element.classList.toggle('marquee-inverted', isInverted);
          }
        });
      });

      observer.observe(document.body, { attributes: true });
    }

    // Only add hover listeners if hover is enabled
    if (hasHover) {
      element.addEventListener('mouseenter', () => {
        gsap.to(animation, {
          timeScale: currentDirection / 4,
          duration: 0.5
        });
      });

      element.addEventListener('mouseleave', () => {
        gsap.to(animation, {
          timeScale: currentDirection,
          duration: 0.5
        });
      });
    }
  }

  // Only create scroll effect if scrollSpeed > 0
  if (scrollSpeed > 0) {
    scrollContainer.style.marginLeft = `-${scrollSpeed}%`;
    scrollContainer.style.width = `${(scrollSpeed * 2) + 100}%`;
    
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: '0% 100%',
        end: '100% 0%',
        scrub: scrub === 'smoother' ? 4 :
               scrub === 'smooth' ? 2 :
               scrub === 'snap' ? { snap: 0.2 } :
               scrub ? true : 0
      }
    });

    const scrollStart = directionMultiplier === -1 ? scrollSpeed : -scrollSpeed;
    scrollTl.fromTo(scrollContainer, 
      { x: `${scrollStart}vw` }, 
      { x: `${-scrollStart}vw`, ease: 'none' }
    );
  }
}

function createScrollAnimations(gsap, ScrollTrigger) {
  // Initialize global scroll state first
  initializeScrollState();
  
  return {
    nav: (element, type, ease, duration, distance, scrolled) => {
      initializeNav(element, type, ease, duration, distance, scrolled);
    },
    
    backgroundColor: (element, duration, ease, viewportPercentage, debug) => {
      initializeBackgroundColor(element, gsap, ScrollTrigger, duration, ease, viewportPercentage, debug);
    },
    
    parallax: (element, scroll) => {
      initializeParallax(element, gsap, ScrollTrigger, scroll);
    },
    
    appear: (element, duration, ease, delay, distance) => {
      return createAppearTimeline(element, gsap, duration, ease, delay, distance);
    },
    
    reveal: (element, duration, ease, delay) => {
      return createRevealTimeline(element, gsap, duration, ease, delay);
    },
    
    counter: (element, duration, ease, delay) => {
      return createCounterTimeline(element, gsap, duration, ease, delay);
    },
    
    marquee: (element, duration, scrub) => {
      return createMarqueeTimeline(element, gsap, duration, scrub);
    }
  };
}

export { createScrollAnimations }; 