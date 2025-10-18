import { triggerAnimations } from '../utils/animationEventTrigger';

//
// Helper Functions
//
function getElementParams(element, defaultDuration = 1) {
  return {
    toggleId: element.getAttribute('aa-accordion-toggle'),
    contentId: element.getAttribute('aa-accordion-content'),
    duration: parseFloat(element.getAttribute('aa-duration')) || defaultDuration / 2
  };
}

function getReverseDuration(element, defaultDuration) {
  const duration = parseFloat(element.getAttribute('aa-duration')) || defaultDuration;
  const delay = parseFloat(element.getAttribute('aa-delay')) || 0;
  return (duration + delay) / 2;
}



function triggerAccordionAnimations(container, action) {
  const animatedElements = [
    ...(container.hasAttribute('aa-animate') ? [container] : []),
    ...container.querySelectorAll('[aa-animate]')
  ];
  
  triggerAnimations(animatedElements, action);
}

function setupAriaAttributes(toggle, content, toggleId) {
  const ariaToggleId = `accordion-toggle-${toggleId}`;
  const ariaContentId = `accordion-content-${toggleId}`;
  
  toggle.setAttribute('id', ariaToggleId);
  content.setAttribute('id', ariaContentId);
  
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', ariaContentId);
  toggle.setAttribute('tabindex', '0');
  toggle.setAttribute('role', 'button');
  content.setAttribute('aria-labelledby', ariaToggleId);
  content.setAttribute('role', 'region');
}

function setupElementEventListeners(toggle, handleToggle) {
  toggle.addEventListener('click', handleToggle);
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  });
}

function autoAssignIds(accordion) {
  const toggles = accordion.querySelectorAll('[aa-accordion-toggle]');
  const contents = accordion.querySelectorAll('[aa-accordion-content]');
  const visuals = accordion.querySelectorAll('[aa-accordion-visual]');
  
  toggles.forEach((toggle, index) => {
    if (!toggle.getAttribute('aa-accordion-toggle')) {
      toggle.setAttribute('aa-accordion-toggle', `accordion-${index}`);
    }
  });
  
  contents.forEach((content, index) => {
    if (!content.getAttribute('aa-accordion-content')) {
      content.setAttribute('aa-accordion-content', `accordion-${index}`);
    }
  });
  
  visuals.forEach((visual, index) => {
    if (!visual.getAttribute('aa-accordion-visual')) {
      visual.setAttribute('aa-accordion-visual', `accordion-${index}`);
    }
  });
}

function initializeAccordionElements(accordion, toggles, contents, animations, splitText, defaultDuration = 1) {
  const initialToggle = accordion.querySelector('[aa-accordion-initial]');
  
  // Set all toggles to inactive initially
  toggles.forEach((toggle) => {
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const content = accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
    const visual = accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);
    
    // Set initial states
    toggle.setAttribute('aa-accordion-status', 'inactive');
    toggle.setAttribute('aria-expanded', 'false');
    
    if (content) {
      content.setAttribute('aa-accordion-status', 'inactive');
    }
    
    if (visual) {
      visual.setAttribute('aa-accordion-status', 'inactive');
      gsap.set(visual, { visibility: 'hidden' });
    }
  });
  
  // Mark content elements for event-based triggering
  contents.forEach((content) => {
    const contentId = content.getAttribute('aa-accordion-content');
    
    // Set CSS variable for aa-duration on content element
    const contentDuration = parseFloat(content.getAttribute('aa-duration')) || defaultDuration / 2;
    content.style.setProperty('--aa-duration', `${contentDuration}s`);
    
    // Mark content elements for event-based triggering
    const contentAnimatedElements = [
      ...(content.hasAttribute('aa-animate') ? [content] : []),
      ...content.querySelectorAll('[aa-animate]')
    ];
    contentAnimatedElements.forEach(el => {
      el.setAttribute('aa-event-trigger', '');
    });
    
    // Setup connected visual elements
    const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${contentId}"]`);
    if (connectedVisual) {
      // Mark visual elements for event-based triggering
      const visualAnimatedElements = [
        ...(connectedVisual.hasAttribute('aa-animate') ? [connectedVisual] : []),
        ...connectedVisual.querySelectorAll('[aa-animate]')
      ];
      visualAnimatedElements.forEach(el => {
        el.setAttribute('aa-event-trigger', '');
      });
    }
  });
  
  // Open initial accordion if specified
  if (initialToggle) {
    const initialToggleId = initialToggle.getAttribute('aa-accordion-toggle');
    const initialContent = accordion.querySelector(`[aa-accordion-content="${initialToggleId}"]`);
    
    // Add a small delay to ensure all animations are properly set up before opening
    gsap.delayedCall(0.1, () => {
      openAccordion(initialToggle, initialContent, accordion, defaultDuration);
    });
  }
}
// Helper function to update progress bars for type "scroll"
function updateProgressBars(toggles, activeIndex, progress, accordionCount) {
  toggles.forEach((toggle, index) => {
    const progressElement = toggle.querySelector('[aa-accordion-progress]');
    if (!progressElement) return;
    
    const progressType = progressElement.getAttribute('aa-accordion-progress') || 'width';
    
    if (index === activeIndex) {
      // Calculate progress for current accordion
      const accordionProgress = (progress * accordionCount) - index;
      const clampedProgress = Math.max(0, Math.min(1, accordionProgress));
      
      if (progressType === 'circle') {
        const circle = progressElement.querySelector('circle[aa-accordion-progress="circle"]');
        if (circle) {
          const radius = parseFloat(circle.getAttribute('r')) || 25;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (clampedProgress * circumference);
          circle.style.strokeDashoffset = offset;
        }
      } else {
        progressElement.style[progressType] = `${clampedProgress * 100}%`;
      }
    } else {
      // Reset progress for inactive accordions
      if (progressType === 'circle') {
        const circle = progressElement.querySelector('circle[aa-accordion-progress="circle"]');
        if (circle) {
          const radius = parseFloat(circle.getAttribute('r')) || 25;
          const circumference = 2 * Math.PI * radius;
          circle.style.strokeDashoffset = circumference;
        }
      } else {
        progressElement.style[progressType] = '0%';
      }
    }
  });
}

function parseResponsiveAttribute(attribute, defaultValue) {
  if (!attribute) return defaultValue;
  
  if (attribute.includes('|')) {
    const [desktop, mobile] = attribute.split('|');
    const isMobile = window.innerWidth < 768;
    return isMobile ? mobile.trim() : desktop.trim();
  }
  
  return attribute.trim();
}


// 
// Core accordion functions (used by all types)
// 
function openAccordion(toggle, content, accordion, defaultDuration = 1) {
  const { toggleId } = getElementParams(toggle);
  const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);
  
  // 1. Check if any other accordions are open and close them (unless multi)
  const accordionType = accordion.getAttribute('aa-accordion');
  const isMulti = accordionType === 'multi';
  
  if (!isMulti) {
    const allToggles = accordion.querySelectorAll('[aa-accordion-toggle]');
    allToggles.forEach(otherToggle => {
      if (otherToggle !== toggle && otherToggle.getAttribute('aa-accordion-status') === 'active') {
        const otherToggleId = otherToggle.getAttribute('aa-accordion-toggle');
        const otherContent = accordion.querySelector(`[aa-accordion-content="${otherToggleId}"]`);
        closeAccordion(otherToggle, otherContent, accordion, defaultDuration);
      }
    });
  }
  
  // 2. Set current accordion to active
  toggle.setAttribute('aa-accordion-status', 'active');
  toggle.setAttribute('aria-expanded', 'true');
  
  if (content) {
    gsap.set(content, { gridTemplateRows: '1fr' });
    content.setAttribute('aa-accordion-status', 'active');
    triggerAccordionAnimations(content, 'play');
  }
  
  // 3. Handle opening visuals - wait for any previous visual to finish closing
  if (connectedVisual) {
    // Check if there's a currently active visual that needs to close first
    const previouslyActiveVisual = accordion.querySelector('[aa-accordion-visual][aa-accordion-status="active"]');
    
    if (previouslyActiveVisual && previouslyActiveVisual !== connectedVisual) {
      // Previous visual is being closed by closeAccordion call above
      // Wait for it to complete before starting new one
      const reverseDuration = getReverseDuration(previouslyActiveVisual, defaultDuration);
      
      gsap.delayedCall(reverseDuration, () => {
        connectedVisual.setAttribute('aa-accordion-status', 'active');
        gsap.set(connectedVisual, { visibility: 'visible' });
        triggerAccordionAnimations(connectedVisual, 'play');
      });
    } else {
      // No previous visual, start immediately
      connectedVisual.setAttribute('aa-accordion-status', 'active');
      gsap.set(connectedVisual, { visibility: 'visible' });
      triggerAccordionAnimations(connectedVisual, 'play');
    }
  }
  
  const { duration } = content ? getElementParams(content, defaultDuration) : defaultDuration / 2;
  gsap.delayedCall(duration, () => {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  });
}

function closeAccordion(toggle, content, accordion, defaultDuration = 1) {
  toggle.setAttribute('aa-accordion-status', 'inactive');
  if (content) {
    content.setAttribute('aa-accordion-status', 'inactive');
  }
  toggle.setAttribute('aria-expanded', 'false');

  const { duration } = content ? getElementParams(content) : defaultDuration / 2;
  const { toggleId } = getElementParams(toggle);
  const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);
  const progressElement = toggle.querySelector('[aa-accordion-progress]');

  // Reverse content animations 
  if (content) {
    gsap.set(content, { gridTemplateRows: '0fr' });
    triggerAccordionAnimations(content, 'reverse');
  }

  // Hide connected visual
  if (connectedVisual) {
    triggerAccordionAnimations(connectedVisual, 'reverse');
    
    // Calculate reverse animation duration (2x faster)
    const reverseDuration = getReverseDuration(connectedVisual, defaultDuration);
    
    // Hide after reverse completes
    gsap.delayedCall(reverseDuration, () => {
      gsap.set(connectedVisual, { visibility: 'hidden' });
      connectedVisual.setAttribute('aa-accordion-status', 'inactive');
    });
  }

  // Reset progress bar
  if (progressElement) {
    const circle = toggle.querySelector('circle[aa-accordion-progress="circle"]');
    if (circle) {
      // Reset circular progress to empty using large values
      gsap.set(circle, { 
        strokeDasharray: 10000,
        strokeDashoffset: 10000 
      });
    } else {
      const progressType = progressElement.getAttribute('aa-accordion-progress') || 'width';
      gsap.set(progressElement, { [progressType]: 0 });
    }
  }
  
  
  gsap.delayedCall(duration, () => {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  });
}


// 
// Main accordion types
// 

// Initialize basic/multi accordion
function initializeBasicAccordion(accordion, toggles, isMulti, animations, splitText, defaultDuration = 1) {
  toggles.forEach((toggle) => {
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    
    toggle.setAttribute('aa-accordion-status', 'inactive');
    const connectedContent = accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
    
    if (connectedContent) {
      setupAriaAttributes(toggle, connectedContent, toggleId);
    }
    
    // Setup connected visual even if there's no content
    const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);
    if (connectedVisual && !connectedContent) {
      connectedVisual.setAttribute('aa-accordion-status', 'inactive');
      gsap.set(connectedVisual, { visibility: 'hidden' });
      
      // Mark visual elements for event-based triggering
      const visualAnimatedElements = [
        ...(connectedVisual.hasAttribute('aa-animate') ? [connectedVisual] : []),
        ...connectedVisual.querySelectorAll('[aa-animate]')
      ];
      visualAnimatedElements.forEach(el => {
        el.setAttribute('aa-event-trigger', '');
      });
    }
    
    const handleToggle = () => {
      const content = connectedContent;
      const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
      
      if (isActive) {
        closeAccordion(toggle, content, accordion, defaultDuration);
      } else {
        openAccordion(toggle, content, accordion, defaultDuration);
      }
    };

    setupElementEventListeners(toggle, handleToggle);
  });
}

// Initialize autoplay accordion
function initializeAutoplayAccordion(accordion, toggles, animations, splitText, defaultDuration = 1) {
  let progressTween = null;
  let currentAutoplayIndex = 0;
  let currentlyOpenAccordion = null;
  let scrollInstance = null;
  
  // Check for initial toggle and set currentlyOpenAccordion
  const initialToggle = accordion.querySelector('[aa-accordion-initial]');
  if (initialToggle) {
    currentlyOpenAccordion = initialToggle;
    currentAutoplayIndex = Array.from(toggles).indexOf(initialToggle);
  }
  
  // Set up toggles
  toggles.forEach((toggle) => {
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const connectedContent = accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
    
    if (connectedContent) {
      setupAriaAttributes(toggle, connectedContent, toggleId);
    }
    
    // Setup connected visual even if there's no content
    const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);
    if (connectedVisual && !connectedContent) {
      // Mark visual elements for event-based triggering
      const visualAnimatedElements = [
        ...(connectedVisual.hasAttribute('aa-animate') ? [connectedVisual] : []),
        ...connectedVisual.querySelectorAll('[aa-animate]')
      ];
      visualAnimatedElements.forEach(el => {
        el.setAttribute('aa-event-trigger', '');
      });
    }
    
    const handleToggle = () => {
      const content = connectedContent;
      const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
      const hasInitialToggle = accordion.querySelector('[aa-accordion-initial]');
      
      if (progressTween?.isActive()) {
        const currentToggleIndex = Array.from(toggles).indexOf(toggle);
        if (currentToggleIndex === currentAutoplayIndex) return;
      }
      
      stopAutoplay();
      
      // Prevent closing active accordion if it has initial toggle
      if (isActive && hasInitialToggle) {
        return;
      }
      
      if (isActive) {
        closeAccordion(toggle, content, accordion, defaultDuration);
      } else {
        toggles.forEach(otherToggle => {
          if (otherToggle !== toggle) {
            const otherId = otherToggle.getAttribute('aa-accordion-toggle');
            const otherContent = accordion.querySelector(`[aa-accordion-content="${otherId}"]`);
            if (otherToggle.getAttribute('aa-accordion-status') === 'active') {
              closeAccordion(otherToggle, otherContent, accordion, defaultDuration);
            }
          }
        });
        openAccordion(toggle, content, accordion, defaultDuration);
        currentlyOpenAccordion = toggle;
      }
      
      if (scrollInstance?.isActive) {
        const clickedIndex = Array.from(toggles).indexOf(toggle);
        if (clickedIndex !== -1) switchToAccordion(clickedIndex);
      }
    };

    setupElementEventListeners(toggle, handleToggle);
  });
  
  // Initialize ScrollTrigger for autoplay
  if (window.ScrollTrigger) {
    scrollInstance = ScrollTrigger.create({
      trigger: accordion,
      start: 'top bottom',
      end: 'bottom top',
      toggleActions: 'play pause resume pause',
      onEnter: () => {
        if (!progressTween) {
          // Small delay to ensure any initial accordion opening is complete
          gsap.delayedCall(0.1, () => {
            switchToAccordion(currentAutoplayIndex);
          });
        }
      },
      onToggle: ({ isActive }) => {
        if (progressTween) {
          isActive ? progressTween.play() : progressTween.pause();
        }
      }
    });
    
    if (scrollInstance.isActive) {
      // Wait a bit longer to ensure initial accordion is fully opened before starting autoplay
      gsap.delayedCall(0.2, () => {
        switchToAccordion(currentAutoplayIndex);
      });
    }
  }
  
  // Autoplay functions
  function stopAutoplay() {
    if (progressTween) {
      progressTween.kill();
      progressTween = null;
    }
  }
  
  function startProgress(index, duration) {
    if (progressTween) progressTween.kill();
    
    const toggle = toggles[index];
    
    // Check for circular progress first
    const circle = toggle.querySelector('circle[aa-accordion-progress="circle"]');
    if (circle) {
      const progressEase = circle.getAttribute('aa-ease') || 'power1.inOut';
      
      // Calculate circumference for stroke-dasharray
      const radius = parseFloat(circle.getAttribute('r')) || 25;
      const circumference = 2 * Math.PI * radius;
      
      // Set initial state (empty circle)
      gsap.set(circle, { 
        strokeDasharray: circumference,
        strokeDashoffset: circumference 
      });
      
      progressTween = gsap.to(circle, {
        strokeDashoffset: 0,
        duration,
        ease: progressEase,
        onComplete: () => {
          if (scrollInstance?.isActive) {
            const nextIndex = (index + 1) % toggles.length;
            switchToAccordion(nextIndex);
          }
        },
        paused: !scrollInstance?.isActive
      });
    } else {
      // Handle linear progress (width/height) or no progress bar
      const progressElement = toggle.querySelector('[aa-accordion-progress]');
      
      if (progressElement) {
        const progressType = progressElement.getAttribute('aa-accordion-progress') || 'width';
        const progressEase = progressElement.getAttribute('aa-ease') || 'power1.inOut';
        
        gsap.set(progressElement, { [progressType]: 0 });
        
        progressTween = gsap.to(progressElement, {
          [progressType]: '100%',
          duration,
          ease: progressEase,
          onComplete: () => {
            if (scrollInstance?.isActive) {
              const nextIndex = (index + 1) % toggles.length;
              switchToAccordion(nextIndex);
            }
          },
          paused: !scrollInstance?.isActive
        });
      } else {
        // No progress bar - just use a simple timer
        progressTween = gsap.delayedCall(duration, () => {
          if (scrollInstance?.isActive) {
            const nextIndex = (index + 1) % toggles.length;
            switchToAccordion(nextIndex);
          }
        });
      }
    }
    
    if (scrollInstance?.isActive) {
      progressTween.play();
    }
  }
  
  function switchToAccordion(index) {
    if (index >= toggles.length) return;
    
    const toggle = toggles[index];
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const content = accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
    
    if (currentlyOpenAccordion && currentlyOpenAccordion !== toggle) {
      const openToggleId = currentlyOpenAccordion.getAttribute('aa-accordion-toggle');
      const openContent = accordion.querySelector(`[aa-accordion-content="${openToggleId}"]`);
      closeAccordion(currentlyOpenAccordion, openContent, accordion, defaultDuration);
    }
    
    const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
    if (!isActive) {
      openAccordion(toggle, content, accordion, defaultDuration);
      currentlyOpenAccordion = toggle;
    }
    
    const autoplayDuration = parseFloat(accordion.getAttribute('aa-duration')) || 5;
    currentAutoplayIndex = index;
    startProgress(index, autoplayDuration);
  }
}

// Initialize scroll accordion with optimized approach
function initializeScrollAccordion(accordion, toggles, defaultDuration = 1) {
  if (!window.ScrollTrigger) return;
  
  // Get configuration with mobile support
  const scrollStartAttr = accordion.getAttribute('aa-scroll-start') || 'top 20%';
  const scrollStart = parseResponsiveAttribute(scrollStartAttr, 'top 20%');
  const distanceAttr = accordion.getAttribute('aa-distance') || '100';
  const scrubValue = accordion.getAttribute('aa-scrub') || 'true';
  const accordionCount = toggles.length;
  
  // Calculate scroll distance (convert vh to pixels for ScrollTrigger)
  const totalScrollDistance = accordionCount * parseFloat(distanceAttr) * window.innerHeight / 100;
  
  // Check for initial accordion
  const initialAccordion = accordion.querySelector('[aa-accordion-initial]');
  const hasInitialAccordion = initialAccordion && toggles[0] === initialAccordion;
  
  // Track current active accordion
  let currentActiveIndex = hasInitialAccordion ? 0 : -1;
  
  // Disable click functionality for scroll-driven accordions
  toggles.forEach((toggle) => {
    toggle.style.pointerEvents = 'none';
    toggle.style.cursor = 'default';
  });
  
  // Create a dummy animation object for scrub to work with
  const dummyProgress = { value: 0 };
  const progressTween = gsap.to(dummyProgress, {
    value: 1,
    duration: 1,
    ease: 'none',
    paused: true,
    onUpdate: () => {
      const progress = dummyProgress.value;
      let newActiveIndex;
      
      if (hasInitialAccordion) {
        // With initial accordion: first accordion is active from progress 0, others follow
        newActiveIndex = Math.min(Math.floor(progress * accordionCount), accordionCount - 1);
      } else {
        // Without initial accordion: no accordion active until progress > 0
        newActiveIndex = progress > 0 ? Math.min(Math.floor(progress * accordionCount), accordionCount - 1) : -1;
      }
      
      // Only update when accordion changes
      if (currentActiveIndex !== newActiveIndex) {
        // Close previous accordion
        if (currentActiveIndex >= 0) {
          const prevToggle = toggles[currentActiveIndex];
          const prevToggleId = prevToggle.getAttribute('aa-accordion-toggle');
          const prevContent = accordion.querySelector(`[aa-accordion-content="${prevToggleId}"]`);
          closeAccordion(prevToggle, prevContent, accordion, defaultDuration);
        }
        
        // Open new accordion
        if (newActiveIndex >= 0) {
          const newToggle = toggles[newActiveIndex];
          const newToggleId = newToggle.getAttribute('aa-accordion-toggle');
          const newContent = accordion.querySelector(`[aa-accordion-content="${newToggleId}"]`);
          openAccordion(newToggle, newContent, accordion, defaultDuration);
        }
        
        currentActiveIndex = newActiveIndex;
      }
      
      // Update progress bars efficiently
      updateProgressBars(toggles, newActiveIndex, progress, accordionCount);
    }
  });
  
  // Create ScrollTrigger to scrub the progress tween
  const scrollTrigger = ScrollTrigger.create({
    trigger: accordion,
    start: scrollStart,
    end: `+=${totalScrollDistance}`,
    pin: true,
    pinSpacing: true,
    scrub: scrubValue ? (parseFloat(scrubValue) || true) : true,
    animation: progressTween
  });
  
  // Handle responsive updates for aa-scroll-start
  if (scrollStartAttr.includes('|')) {
    let prevWidth = window.innerWidth;
    
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const crossedBreakpoint = (prevWidth >= 768 && currentWidth < 768) || (prevWidth < 768 && currentWidth >= 768);
      
      if (crossedBreakpoint) {
        const newScrollStart = parseResponsiveAttribute(scrollStartAttr, 'top 20%');
        
        // Update ScrollTrigger with new start position
        scrollTrigger.vars.start = newScrollStart;
        scrollTrigger.refresh();
        
        prevWidth = currentWidth;
      }
    };
    
    // Use debounced resize handler
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 250);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Handle orientation change on mobile
    if (window.matchMedia('(hover: none)').matches) {
      window.addEventListener('orientationchange', () => {
        setTimeout(debouncedResize, 100);
      });
    }
  }
}

// 
// Main initialization function
// 

function initializeAccordion(accordion, animations = null, splitText = null, defaultDuration = 1) {
  
  const accordionType = accordion.getAttribute('aa-accordion');
  const isMulti = accordionType === 'multi';
  const isAutoplay = accordionType === 'autoplay';
  const isScroll = accordionType === 'scroll';
  const toggles = accordion.querySelectorAll('[aa-accordion-toggle]');
  const contents = accordion.querySelectorAll('[aa-accordion-content]');
  
  // Auto-assign IDs if not provided
  autoAssignIds(accordion);
  
  // Initialize accordion elements: states and animations
  initializeAccordionElements(accordion, toggles, contents, animations, splitText, defaultDuration);
  
   // Initialize based on accordion type
   if (isScroll) {
     initializeScrollAccordion(accordion, toggles, defaultDuration);
   } else if (isAutoplay) {
     initializeAutoplayAccordion(accordion, toggles, animations, splitText, defaultDuration);
   } else {
     initializeBasicAccordion(accordion, toggles, isMulti, animations, splitText, defaultDuration);
   }
}

function createAccordionAnimations(gsap, animations, splitText, defaultDuration = 1) {
  return {
    accordion: (accordion) => initializeAccordion(accordion, animations, splitText, defaultDuration)
  };
}

export { createAccordionAnimations }; 