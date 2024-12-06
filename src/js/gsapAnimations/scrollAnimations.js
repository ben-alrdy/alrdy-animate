// Helper function to get scroll trigger values
function getScrollTriggerValues(isMobile) {
  return {
    start: isMobile ? "top 40%" : "top 80%",
    end: isMobile ? "top 20%" : "top 40%"
  };
}

function initializeStickyNav(element, ease, duration) {
  let isVisible = true;
  let lastScrollTop = 0;
  const scrollThreshold = 20;

  // Function to ensure nav is visible at top
  const showNavAtTop = () => {
    isVisible = true;
    gsap.to(element, { y: '0%', duration, ease, overwrite: true });
  };

  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      let currentScrollTop = self.scroll();

      if (currentScrollTop <= 10) {
        showNavAtTop();
        lastScrollTop = currentScrollTop;
        return;
      }

      let scrollDelta = currentScrollTop - lastScrollTop;

      if (Math.abs(scrollDelta) > scrollThreshold) {
        if (scrollDelta > 0 && isVisible) {
          isVisible = false;
          gsap.to(element, { y: '-100%', duration: duration * 2, ease, overwrite: true });
        } else if (scrollDelta < 0 && !isVisible) {
          showNavAtTop();
        }
        lastScrollTop = currentScrollTop;
      }
    },
    onLeaveBack: showNavAtTop,
    onLeave: showNavAtTop
  });
}

function initializeBackgroundColor(element, gsap, ScrollTrigger, duration = 0.5, ease = 'power2.inOut', viewportPercentage, debug = false) {
  
  // Create base animation config
  const animConfig = {
    duration,
    ease,
    overwrite: true
  };
  
  // Store original colors
  const originalColors = {
    parent: {
      backgroundColor: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color
    }
  };
  
  // Find and store trigger elements and their colors
  const triggers = Array.from(element.querySelectorAll('[aa-parent-bg]'));
  const childOriginalColors = new Map(
    triggers.map(trigger => {
      const computedStyle = window.getComputedStyle(trigger);
      return [trigger, {
        backgroundColor: computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : computedStyle.backgroundColor,
        color: computedStyle.color
      }];
    })
  );
  
  let currentActiveChild = null;
  
  // Helper function to animate color changes
  const animateColors = (target, colors) => {
    gsap.to(target, {
      ...animConfig,
      backgroundColor: colors.backgroundColor || null,
      color: colors.color || null
    });
  };
  
  triggers.forEach((trigger, index) => {
    const prevTrigger = index === 0 ? null : triggers[index - 1];
    
    // Get all color attributes
    const colors = {
      parent: {
        backgroundColor: trigger.getAttribute('aa-parent-bg'),
        color: trigger.getAttribute('aa-parent-text')
      },
      child: {
        backgroundColor: trigger.getAttribute('aa-child-bg'),
        color: trigger.getAttribute('aa-child-text')
      },
      prevParent: {
        backgroundColor: prevTrigger?.getAttribute('aa-parent-bg') || originalColors.parent.backgroundColor,
        color: prevTrigger?.getAttribute('aa-parent-text') || originalColors.parent.color
      }
    };
    
    ScrollTrigger.create({
      trigger: trigger,
      start: `top ${viewportPercentage * 100}%`,
      onEnter: () => {
        // Revert previous active child
        if (currentActiveChild && currentActiveChild !== trigger) {
          const originalChildColors = childOriginalColors.get(currentActiveChild);
          animateColors(currentActiveChild, originalChildColors);
        }
        
        // Animate parent
        animateColors(element, colors.parent);
        
        // Animate current child if needed
        if (colors.child.backgroundColor || colors.child.color) {
          animateColors(trigger, colors.child);
          currentActiveChild = trigger;
        }
      },
      onLeaveBack: () => {
        // Animate parent back
        animateColors(element, colors.prevParent);
        
        // Handle child animations
        if (currentActiveChild === trigger) {
          // Revert current child to original colors
          const originalChildColors = childOriginalColors.get(trigger);
          animateColors(trigger, originalChildColors);
          
          // Activate previous child if it exists
          if (prevTrigger && 
              (prevTrigger.getAttribute('aa-child-bg') || 
               prevTrigger.getAttribute('aa-child-text'))) {
            animateColors(prevTrigger, {
              backgroundColor: prevTrigger.getAttribute('aa-child-bg') || childOriginalColors.get(prevTrigger).backgroundColor,
              color: prevTrigger.getAttribute('aa-child-text') || childOriginalColors.get(prevTrigger).color
            });
            currentActiveChild = prevTrigger;
          } else {
            currentActiveChild = null;
          }
        }
      },
      markers: debug
    });
  });
}

function initializeParallax(element, gsap, ScrollTrigger, scroll = 'smooth') {
  // Get configuration from attributes
  const [_, direction, value] = element.getAttribute('aa-animate').split('-');
  const parallaxValue = value || direction || 40; // Handles both parallax-40 and parallax-down-40
  const isDownward = direction === 'down';
  
  // Check if parent has overflow:hidden
  const parentStyle = window.getComputedStyle(element.parentElement);
  const hasOverflowHidden = parentStyle.overflow === 'hidden';

  if (hasOverflowHidden) {
    // Calculate required scale based on parallax value
    const scale = 1 + (2 * parallaxValue / element.offsetHeight);
    gsap.set(element, { scale });
  } 
  
  ScrollTrigger.create({
    trigger: element.parentElement,
    start: "top bottom",
    end: "bottom top",
    scrub: scroll.includes('smoother') ? 200 :
           scroll.includes('smooth') ? 50 :
           scroll.includes('snap') ? { snap: 0.2 } : true,
    onUpdate: (self) => {
      // Calculate y position based on scroll progress
      // For downward movement, we invert the calculation
      const yPos = parallaxValue * (self.progress * 2 - 1) * (isDownward ? -1 : 1);
      gsap.set(element, { y: yPos });
    }
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
    duration: duration || 1,
    ease: ease || 'power2.out',
    delay: delay || 0
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
    duration: duration || 1,
    ease: ease || 'power2.inOut',
    delay: delay || 0
  });
}

function createScrollAnimations(gsap, ScrollTrigger) {
  return {
    stickyNav: (element, ease = 'back.inOut', duration = 0.4) => {
      initializeStickyNav(element, ease, duration);
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
    }
  };
}

export { createScrollAnimations }; 