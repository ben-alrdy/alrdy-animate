// Define accordion animations for content elements
const accordionAnimations = {
  'fade': { opacity: 0 },
  'fade-up': { opacity: 0, yPercent: 10 },
  'fade-down': { opacity: 0, yPercent: -10 },
  'fade-left': { opacity: 0, xPercent: 5 },
  'fade-right': { opacity: 0, xPercent: -5 },
  'slide-up': { yPercent: 110 },
  'slide-down': { yPercent: -110 },
  'slide-left': { xPercent: 110 },
  'slide-right': { xPercent: -110 },
  'scale': { scale: 0.8, opacity: 0, transformOrigin: 'center' }
};

// Common animation properties
const CUSTOM_ANIMATION_PROPS = {
  x: 0, y: 0, xPercent: 0, yPercent: 0, opacity: 1, scale: 1
};

//
// Helper Functions
//
function getElementParams(element, type = 'animation') {
  const orderAttr = element.getAttribute('aa-accordion-order') || '';
  const [orderStr, percentStr] = orderAttr.split('-');
  const order = parseInt(orderStr) || 0;
  const percent = percentStr ? percentStr : null;
  
  const params = {
    duration: parseFloat(element.getAttribute('aa-duration')) || 0.2,
    ease: element.getAttribute('aa-ease') || 'power4.out',
    opacity: parseFloat(element.getAttribute('aa-opacity')) || 1,
    timelinePosition: percent ? `>-${percent}%` : '<',
    order,
    percent,
    animationType: element.getAttribute('aa-accordion-animate'),
    delay: parseFloat(element.getAttribute('aa-delay')) || 0.3
  };
  
  if (type === 'accordion') {
    params.toggleId = element.getAttribute('aa-accordion-toggle');
    params.contentId = element.getAttribute('aa-accordion-content');
  }
  
  return params;
}

function getElementData(elements) {
  return Array.from(elements).map(element => {
    const params = getElementParams(element, 'animation');
    return {
      element,
      order: params.order,
      percent: params.percent,
      animationType: params.animationType,
      duration: params.duration,
      ease: params.ease,
      opacity: params.opacity,
      timelinePosition: params.timelinePosition
    };
  }).sort((a, b) => a.order - b.order);
}

function getBaseType(animationType) {
  return animationType ? (animationType.includes('-') ? animationType.split('-')[0] : animationType) : null;
}

function handleTextAnimation(element, animationType, animations, splitText, tl, position, duration, ease) {
  const split = element.getAttribute('aa-split') || 'lines';
  const stagger = parseFloat(element.getAttribute('aa-stagger')) || 0.01;
  
  const baseTextAnim = animationType.replace(/-clip|-lines|-words|-chars$/, '');
  const animation = animations.text[baseTextAnim];
  
  if (!animation) {
    console.warn('[Timeline][Text] No animation found for:', animationType);
    return;
  }
  
  const animConfig = animation(element, split, duration, stagger, 0, ease);
  
  splitText(element, split, false, (self) => {
    const timeline = animConfig.onSplit(self);
    tl.add(timeline, position);
    return timeline;
  }, animationType);
}

function handleComplexAnimation(element, baseType, animations, duration, ease, distance, animationType, opacity = 1) {
  if (!animations || !animations[baseType]) return null;
  
  let animationTimeline;
  switch (baseType) {
    case 'appear':
      animationTimeline = animations.appear(element, duration, ease, 0, distance, animationType, opacity);
      break;
    case 'reveal':
      animationTimeline = animations.reveal(element, duration, ease, 0, animationType, opacity);
      break;
    case 'counter':
      animationTimeline = animations.counter(element, duration, ease, 0, animationType);
      break;
    case 'grow':
      animationTimeline = animations.grow(element, duration, ease, 0, animationType);
      break;
  }
  
  return animationTimeline;
}

function handleSimpleAnimation(element, animationType, tl, timelinePosition, duration, ease, isVisual = false) {
  const animation = accordionAnimations[animationType];
  
  if (animationType.includes('custom')) {
    tl.to(element, { ...CUSTOM_ANIMATION_PROPS, duration, ease }, timelinePosition);
  } else if (animation) {
    if (isVisual) {
      tl.to(element, { 
        ...animation, opacity: 1, scale: 1, xPercent: 0, yPercent: 0,
        duration, ease
      }, timelinePosition);
    } else {
      tl.from(element, { ...animation, duration, ease }, timelinePosition);
    }
  }
}

function collectAnimatedElements(container, includeSelf = false) {
  const elements = includeSelf && container.hasAttribute('aa-accordion-animate') 
    ? [container, ...container.querySelectorAll('[aa-accordion-animate]')]
    : container.querySelectorAll('[aa-accordion-animate]');
  
  return Array.from(elements);
}

function createTimeline(container, animations, splitText, isVisual = false) {
  const animatedElements = collectAnimatedElements(container, !isVisual);
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.inOut' } });
  
  const elementData = getElementData(animatedElements);
  
  elementData.forEach(({ element, animationType, duration, ease, opacity, timelinePosition }) => {
    const baseType = getBaseType(animationType);

    if (baseType === 'text' && animations?.text && splitText) {
        handleTextAnimation(element, animationType, animations, splitText, tl, timelinePosition, duration, ease);
    } else if (animations && animations[baseType]) {
      const distance = parseFloat(element.getAttribute('aa-distance')) || 1;
      const animationTimeline = handleComplexAnimation(element, baseType, animations, duration, ease, distance, animationType, opacity);
      if (animationTimeline) {
        tl.add(animationTimeline, timelinePosition);
      }
    } else {
      handleSimpleAnimation(element, animationType, tl, timelinePosition, duration, ease, isVisual);
    }
  });
  
  return tl;
}

function setInitialElementState(element, animationType) {
  if (!animationType) return;
  
  const animation = accordionAnimations[animationType];
  
  if (animation && !animationType.includes('custom')) {
    gsap.set(element, animation);
  }
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

function initializeAccordionElements(accordion, toggles, contents, timelines, animations, splitText) {
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
  
  // Initialize content timelines and animations
  contents.forEach((content) => {
    const contentId = content.getAttribute('aa-accordion-content');
    
    // Create timeline and set initial state for content
    const tl = createTimeline(content, animations, splitText, false);
    timelines.set(content, tl);
    
    // Set initial animation states for content elements
    const animatedElements = collectAnimatedElements(content, true);
    animatedElements.forEach(element => {
      const { animationType } = getElementParams(element, 'animation');
      setInitialElementState(element, animationType);
    });
    
    // Setup connected visual timeline
    const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${contentId}"]`);
    if (connectedVisual) {
      const visualTimeline = createTimeline(connectedVisual, animations, splitText, true);
      timelines.set(connectedVisual, visualTimeline);
      
      // Set initial animation states for visual elements
      const visualAnimatedElements = collectAnimatedElements(connectedVisual, true);
      visualAnimatedElements.forEach(element => {
        const { animationType } = getElementParams(element, 'animation');
        setInitialElementState(element, animationType);
      });
    }
  });
  
  // Open initial accordion if specified
  if (initialToggle) {
    const initialToggleId = initialToggle.getAttribute('aa-accordion-toggle');
    const initialContent = accordion.querySelector(`[aa-accordion-content="${initialToggleId}"]`);
    
    // Add a small delay to ensure all timelines are properly set up before opening
    gsap.delayedCall(0.1, () => {
      openAccordion(initialToggle, initialContent, accordion, timelines);
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
function openAccordion(toggle, content, accordion, timelines) {
  toggle.setAttribute('aa-accordion-status', 'active');
  if (content) {
    content.setAttribute('aa-accordion-status', 'active');
  }
  toggle.setAttribute('aria-expanded', 'true');

  const { duration, delay: accordionDelay } = content ? getElementParams(content, 'accordion') : getElementParams(toggle, 'accordion');
  const { toggleId } = getElementParams(toggle, 'accordion');
  const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);
  
  if (content) {
    gsap.set(content, { gridTemplateRows: '1fr' });
    
    const playContentAnimation = () => {
      const tl = timelines.get(content);
      if (tl) tl.play();
    };
    
    if (accordionDelay > 0) {
      gsap.delayedCall(accordionDelay, playContentAnimation);
    } else {
      playContentAnimation();
    }
  }
  
  if (connectedVisual) {
    // Handle previous visual cleanup first
    const previouslyActiveVisual = accordion.querySelector('[aa-accordion-visual][aa-accordion-status="active"]');
    if (previouslyActiveVisual && previouslyActiveVisual !== connectedVisual) {
      previouslyActiveVisual.setAttribute('aa-accordion-status', 'inactive');
      
      // Animate out the previous visual
      const { duration: prevDuration, ease: prevEase, animationType: previousVisualAnimationType } = getElementParams(previouslyActiveVisual, 'animation');
      if (previousVisualAnimationType) {
        const prevAnimation = accordionAnimations[previousVisualAnimationType];
        
        if (prevAnimation) {
          gsap.to(previouslyActiveVisual, { 
            ...prevAnimation, duration: prevDuration, ease: prevEase,
            onComplete: () => {
              gsap.set(previouslyActiveVisual, { visibility: 'hidden' });
              startNewVisualAnimation();
            }
          });
        } else {
          gsap.set(previouslyActiveVisual, { visibility: 'hidden' });
          startNewVisualAnimation();
        }
      } else {
        gsap.set(previouslyActiveVisual, { visibility: 'hidden' });
        startNewVisualAnimation();
      }
      
      // Reverse previous inner timeline
      const previousInnerTl = timelines.get(previouslyActiveVisual);
      if (previousInnerTl) previousInnerTl.reverse();
    } else {
      startNewVisualAnimation();
    }
    
    function startNewVisualAnimation() {
      connectedVisual.setAttribute('aa-accordion-status', 'active');
      gsap.set(connectedVisual, { visibility: 'visible' });
      
      // Handle main visual animation
      const { duration: visualDuration, ease: visualEase, animationType: visualAnimationType } = getElementParams(connectedVisual, 'animation');
      if (visualAnimationType) {
        const visualAnimation = accordionAnimations[visualAnimationType];
        
        if (visualAnimation) {
          gsap.fromTo(connectedVisual, 
            { ...visualAnimation },
            { 
              opacity: 1, scale: 1, xPercent: 0, yPercent: 0,
              duration: visualDuration, ease: visualEase
            }
          );
        }
      }
      
      // Handle inner animations with delay
      const innerTimeline = timelines.get(connectedVisual);
      if (innerTimeline) {
        const { delay: visualDelay } = getElementParams(connectedVisual, 'animation');
        if (visualDelay > 0) {
          gsap.delayedCall(visualDelay, () => innerTimeline.play());
        } else {
          innerTimeline.play();
        }
      }
    }
  }
  
  gsap.delayedCall(duration, () => {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  });
}

function closeAccordion(toggle, content, accordion, timelines) {
  toggle.setAttribute('aa-accordion-status', 'inactive');
  if (content) {
    content.setAttribute('aa-accordion-status', 'inactive');
  }
  toggle.setAttribute('aria-expanded', 'false');

  const { duration } = content ? getElementParams(content, 'accordion') : getElementParams(toggle, 'accordion');
  const { toggleId } = getElementParams(toggle, 'accordion');
  const connectedVisual = accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);

  // Reset progress bar
  const circle = toggle.querySelector('circle[aa-accordion-progress="circle"]');
  if (circle) {
    // Reset circular progress to empty using large values
    gsap.set(circle, { 
      strokeDasharray: 10000,
      strokeDashoffset: 10000 
    });
  } else {
    const progressElement = toggle.querySelector('[aa-accordion-progress]');
    if (progressElement) {
      const progressType = progressElement.getAttribute('aa-accordion-progress') || 'width';
      gsap.set(progressElement, { [progressType]: 0 });
    }
  }

  // Reverse content animations if content exists
  if (content) {
    const tl = timelines.get(content);
    if (tl) tl.reverse();
  }

    // Hide connected visual
    if (connectedVisual) {
      const { duration: visualDuration, ease: visualEase, animationType: visualAnimationType } = getElementParams(connectedVisual, 'animation');
      if (visualAnimationType) {
        const visualAnimation = accordionAnimations[visualAnimationType];
      
      if (visualAnimation) {
        gsap.to(connectedVisual, { 
          ...visualAnimation, duration: visualDuration, ease: visualEase,
          onComplete: () => {
            gsap.set(connectedVisual, { visibility: 'hidden' });
            connectedVisual.setAttribute('aa-accordion-status', 'inactive');
          }
        });
      } else {
        gsap.set(connectedVisual, { visibility: 'hidden' });
        connectedVisual.setAttribute('aa-accordion-status', 'inactive');
      }
    } else {
      gsap.set(connectedVisual, { visibility: 'hidden' });
      connectedVisual.setAttribute('aa-accordion-status', 'inactive');
    }
    
    const innerTimeline = timelines.get(connectedVisual);
    if (innerTimeline) innerTimeline.reverse();
  }

  if (content) {
    gsap.set(content, { gridTemplateRows: '0fr' });
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
function initializeBasicAccordion(accordion, toggles, timelines, isMulti, animations, splitText) {
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
      
      const visualTimeline = createTimeline(connectedVisual, animations, splitText, true);
      timelines.set(connectedVisual, visualTimeline);
      
      const visualAnimatedElements = collectAnimatedElements(connectedVisual, true);
      visualAnimatedElements.forEach(element => {
        const { animationType } = getElementParams(element, 'animation');
        setInitialElementState(element, animationType);
      });
    }
    
    const handleToggle = () => {
      const content = connectedContent;
      const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
      
      if (isActive) {
        closeAccordion(toggle, content, accordion, timelines);
      } else {
        if (!isMulti) {
          toggles.forEach(otherToggle => {
            if (otherToggle !== toggle) {
              const otherId = otherToggle.getAttribute('aa-accordion-toggle');
              const otherContent = accordion.querySelector(`[aa-accordion-content="${otherId}"]`);
              if (otherToggle.getAttribute('aa-accordion-status') === 'active') {
                closeAccordion(otherToggle, otherContent, accordion, timelines);
              }
            }
          });
        }
        openAccordion(toggle, content, accordion, timelines);
      }
    };

    setupElementEventListeners(toggle, handleToggle);
  });
}

// Initialize autoplay accordion
function initializeAutoplayAccordion(accordion, toggles, timelines, animations, splitText) {
  let progressTween = null;
  let currentAutoplayIndex = 0;
  let currentlyOpenAccordion = null;
  let scrollInstance = null;
  
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
      const visualTimeline = createTimeline(connectedVisual, animations, splitText, true);
      timelines.set(connectedVisual, visualTimeline);
      
      const visualAnimatedElements = collectAnimatedElements(connectedVisual, true);
      visualAnimatedElements.forEach(element => {
        const { animationType } = getElementParams(element, 'animation');
        setInitialElementState(element, animationType);
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
        closeAccordion(toggle, content, accordion, timelines);
      } else {
        toggles.forEach(otherToggle => {
          if (otherToggle !== toggle) {
            const otherId = otherToggle.getAttribute('aa-accordion-toggle');
            const otherContent = accordion.querySelector(`[aa-accordion-content="${otherId}"]`);
            if (otherToggle.getAttribute('aa-accordion-status') === 'active') {
              closeAccordion(otherToggle, otherContent, accordion, timelines);
            }
          }
        });
        openAccordion(toggle, content, accordion, timelines);
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
  const initialToggle = accordion.querySelector('[aa-accordion-initial]');
  currentAutoplayIndex = initialToggle ? Array.from(toggles).indexOf(initialToggle) : 0;
  
  if (window.ScrollTrigger) {
    scrollInstance = ScrollTrigger.create({
      trigger: accordion,
      start: 'top bottom',
      end: 'bottom top',
      toggleActions: 'play pause resume pause',
      onEnter: () => {
        if (!progressTween) {
          switchToAccordion(currentAutoplayIndex);
        }
      },
      onToggle: ({ isActive }) => {
        if (progressTween) {
          isActive ? progressTween.play() : progressTween.pause();
        }
      }
    });
    
    if (scrollInstance.isActive) {
      switchToAccordion(currentAutoplayIndex);
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
      // Handle linear progress (width/height)
      const progressElement = toggle.querySelector('[aa-accordion-progress]');
      if (!progressElement) return;
      
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
    
    // Close all active toggles except the target one
    toggles.forEach(otherToggle => {
      if (otherToggle !== toggle && otherToggle.getAttribute('aa-accordion-status') === 'active') {
        const otherId = otherToggle.getAttribute('aa-accordion-toggle');
        const otherContent = accordion.querySelector(`[aa-accordion-content="${otherId}"]`);
        closeAccordion(otherToggle, otherContent, accordion, timelines);
      }
    });
    
    const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
    if (!isActive) {
      openAccordion(toggle, content, accordion, timelines);
      currentlyOpenAccordion = toggle;
    }
    
    const autoplayDuration = parseFloat(accordion.getAttribute('aa-duration')) || 5;
    currentAutoplayIndex = index;
    startProgress(index, autoplayDuration);
  }
}

// Initialize scroll accordion with optimized approach
function initializeScrollAccordion(accordion, toggles, timelines) {
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
          closeAccordion(prevToggle, prevContent, accordion, timelines);
        }
        
        // Open new accordion
        if (newActiveIndex >= 0) {
          const newToggle = toggles[newActiveIndex];
          const newToggleId = newToggle.getAttribute('aa-accordion-toggle');
          const newContent = accordion.querySelector(`[aa-accordion-content="${newToggleId}"]`);
          openAccordion(newToggle, newContent, accordion, timelines);
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

function initializeAccordions(animations = null, splitText = null) {
  const accordions = document.querySelectorAll('[aa-accordion]');
  const timelines = new Map();

  accordions.forEach((accordion) => {
    const accordionType = accordion.getAttribute('aa-accordion');
    const isMulti = accordionType === 'multi';
    const isAutoplay = accordionType === 'autoplay';
    const isScroll = accordionType === 'scroll';
    const toggles = accordion.querySelectorAll('[aa-accordion-toggle]');
    const contents = accordion.querySelectorAll('[aa-accordion-content]');
    
    // Auto-assign IDs if not provided
    autoAssignIds(accordion);
    
    // Initialize accordion elements: states, timelines, and animations
    initializeAccordionElements(accordion, toggles, contents, timelines, animations, splitText);
    
     // Initialize based on accordion type
     if (isScroll) {
       initializeScrollAccordion(accordion, toggles, timelines);
     } else if (isAutoplay) {
       initializeAutoplayAccordion(accordion, toggles, timelines, animations, splitText);
     } else {
       initializeBasicAccordion(accordion, toggles, timelines, isMulti, animations, splitText);
     }
  });

  // Refresh ScrollTrigger after all accordions have been initialized
  if (window.ScrollTrigger) {
    window.ScrollTrigger.refresh();
  }

  return {
    open: (toggle, content, accordion) => openAccordion(toggle, content, accordion, timelines),
    close: (toggle, content, accordion) => closeAccordion(toggle, content, accordion, timelines),
    timelines
  };
}

function createAccordionAnimations(gsap, animations, splitText) {
  return {
    accordion: () => initializeAccordions(animations, splitText)
  };
}

export { createAccordionAnimations }; 