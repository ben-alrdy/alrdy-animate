// Define accordion animations for content elements
const accordionAnimations = {
  'fade': { opacity: 0 },
  'fade-up': { opacity: 0, yPercent: 10 },
  'fade-down': { opacity: 0, yPercent: -10 },
  'fade-left': { opacity: 0, xPercent: 10 },
  'fade-right': { opacity: 0, xPercent: -10 },
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

const INITIAL_CUSTOM_PROPS = {
  x: 0, y: 0, xPercent: 0, yPercent: 0, opacity: 0, scale: 0.8
};

// Utility functions
function parseElementOrder(element) {
  const orderAttr = element.getAttribute('aa-accordion-order') || '';
  const [orderStr, percentStr] = orderAttr.split('-');
  return {
    order: parseInt(orderStr) || 0,
    percent: percentStr ? percentStr : null
  };
}

function getElementData(elements) {
  return Array.from(elements).map(element => {
    const { order, percent } = parseElementOrder(element);
    return {
      element,
      order,
      percent,
      animationType: element.getAttribute('aa-accordion-animate')
    };
  }).sort((a, b) => a.order - b.order);
}

function getAnimationParams(element, defaultDuration = 0.4, defaultEase = 'power4.out') {
  return {
    duration: parseFloat(element.getAttribute('aa-duration')) || defaultDuration,
    ease: element.getAttribute('aa-ease') || defaultEase,
    distance: parseFloat(element.getAttribute('aa-distance')) || 1,
    timelinePosition: parseElementOrder(element).percent ? `>-${parseElementOrder(element).percent}%` : '<'
  };
}

function getBaseType(animationType) {
  return animationType ? (animationType.includes('-') ? animationType.split('-')[0] : animationType) : null;
}

function calculateTimelinePosition(tl, percent, timelinePosition) {
  if (!percent) return timelinePosition;
  
  const prevEndTime = tl.recent() ? tl.recent().endTime() : 0;
  const prevStartTime = tl.recent() ? tl.recent().startTime() : 0;
  const prevDuration = prevEndTime - prevStartTime;
  return prevStartTime + (prevDuration * (parseInt(percent) / 100));
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

function handleComplexAnimation(element, baseType, animations, timelinePosition, duration, ease, distance, animationType) {
  if (!animations || !animations[baseType]) return null;
  
  let animationTimeline;
  switch (baseType) {
    case 'appear':
      animationTimeline = animations.appear(element, duration, ease, 0, distance, animationType);
      break;
    case 'reveal':
      animationTimeline = animations.reveal(element, duration, ease, 0, animationType);
      break;
    case 'counter':
      animationTimeline = animations.counter(element, duration, ease, 0, animationType);
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

function createTimeline(elements, animations, splitText, options = {}) {
  const { defaultDuration = 0.4, defaultEase = 'power4.inOut', isVisual = false } = options;
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.inOut' } });
  
  const elementData = getElementData(elements);
  
  elementData.forEach(({ element, percent, animationType }) => {
    const { duration, ease, distance, timelinePosition } = getAnimationParams(element, defaultDuration, defaultEase);
    const baseType = getBaseType(animationType);
    const position = calculateTimelinePosition(tl, percent, timelinePosition);

    if (baseType === 'text' && animations?.text && splitText) {
      handleTextAnimation(element, animationType, animations, splitText, tl, position, duration, ease);
    } else if (animations && animations[baseType]) {
      const animationTimeline = handleComplexAnimation(element, baseType, animations, timelinePosition, duration, ease, distance, animationType);
      if (animationTimeline) {
        tl.add(animationTimeline, timelinePosition);
      }
    } else {
      handleSimpleAnimation(element, animationType, tl, timelinePosition, duration, ease, isVisual);
    }
  });
  
  return tl;
}

function createAccordionTimeline(accordionContent, animations, splitText) {
  const animatedElements = collectAnimatedElements(accordionContent, true);
  
  return createTimeline(animatedElements, animations, splitText, {
    defaultDuration: 0.4,
    defaultEase: 'power4.out',
    isVisual: false
  });
}

function createVisualInnerAnimationsTimeline(visualItem, animations, splitText) {
  const animatedElements = collectAnimatedElements(visualItem, false);
  
  return createTimeline(animatedElements, animations, splitText, {
    defaultDuration: 0.2,
    defaultEase: 'power4.inOut',
    isVisual: true
  });
}

function setInitialElementState(element, animationType) {
  const animation = accordionAnimations[animationType];
  
  if (animationType.includes('custom')) {
    gsap.set(element, INITIAL_CUSTOM_PROPS);
  } else if (animation) {
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

function refreshScrollTrigger(duration) {
  gsap.delayedCall(duration, () => {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  });
}

function initializeAccordions(lenis = null, animations = null, splitText = null) {
  const accordions = document.querySelectorAll('[aa-animate="accordion"], [aa-animate="accordion-multi"], [aa-animate="accordion-autoplay"]');
  const timelines = new Map();
  let activeAccordions = new Set();

  accordions.forEach((accordion) => {
    const isMulti = accordion.getAttribute('aa-animate') === 'accordion-multi';
    const isAutoplay = accordion.getAttribute('aa-animate') === 'accordion-autoplay';
    const toggles = accordion.querySelectorAll('[aa-accordion-toggle]');
    const contents = accordion.querySelectorAll('[aa-accordion-content]');
    
    // Autoplay variables
    let progressTween = null;
    let currentAutoplayIndex = 0;
    let currentlyOpenAccordion = null;
    let scrollInstance = null;
    
    // Initialize accordion content
    contents.forEach((content) => {
      const contentId = content.getAttribute('aa-accordion-content');
      if (!contentId) {
        console.warn('Accordion content missing ID:', content);
        return;
      }
      
      content.setAttribute('aa-accordion-status', 'inactive');
      
      // Create timeline and set initial state
      const tl = createAccordionTimeline(content, animations, splitText);
      timelines.set(content, tl);
      
      // Set initial states
      const animatedElements = collectAnimatedElements(content, true);
      animatedElements.forEach(element => {
        const animationType = element.getAttribute('aa-accordion-animate');
        setInitialElementState(element, animationType);
      });
      
      // Setup connected visual
      const connectedVisual = document.querySelector(`[aa-accordion-item="${contentId}"]`);
      if (connectedVisual) {
        connectedVisual.setAttribute('aa-accordion-status', 'inactive');
        gsap.set(connectedVisual, { visibility: 'hidden' });
        
        const visualTimeline = createVisualInnerAnimationsTimeline(connectedVisual, animations, splitText);
        timelines.set(connectedVisual, visualTimeline);
        
        const visualAnimatedElements = collectAnimatedElements(connectedVisual, true);
        visualAnimatedElements.forEach(element => {
          const animationType = element.getAttribute('aa-accordion-animate');
          setInitialElementState(element, animationType);
        });
      }
    });

    // Initialize toggles
    toggles.forEach((toggle) => {
      const toggleId = toggle.getAttribute('aa-accordion-toggle');
      if (!toggleId) {
        console.warn('Accordion toggle missing ID:', toggle);
        return;
      }
      
      toggle.setAttribute('aa-accordion-status', 'inactive');
      const connectedContent = accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
      
      if (connectedContent) {
        setupAriaAttributes(toggle, connectedContent, toggleId);
      }
      
      const handleToggle = () => {
        const content = connectedContent;
        if (!content) return;
        
        const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
        
        if (isAutoplay && progressTween?.isActive()) {
          const currentToggleIndex = Array.from(toggles).indexOf(toggle);
          if (currentToggleIndex === currentAutoplayIndex) return;
        }
        
        if (isAutoplay) stopAutoplay();
        
        if (isActive) {
          closeAccordion(toggle, content, accordion);
        } else {
          if (!isMulti) {
            toggles.forEach(otherToggle => {
              if (otherToggle !== toggle) {
                const otherId = otherToggle.getAttribute('aa-accordion-toggle');
                const otherContent = accordion.querySelector(`[aa-accordion-content="${otherId}"]`);
                if (otherContent && otherToggle.getAttribute('aa-accordion-status') === 'active') {
                  closeAccordion(otherToggle, otherContent, accordion);
                }
              }
            });
          }
          openAccordion(toggle, content, accordion);
          if (isAutoplay) currentlyOpenAccordion = toggle;
        }
        
        if (isAutoplay && scrollInstance?.isActive) {
          const clickedIndex = Array.from(toggles).indexOf(toggle);
          if (clickedIndex !== -1) switchToAccordion(clickedIndex);
        }
      };

      setupElementEventListeners(toggle, handleToggle);
    });

    // Set initial active accordion
    const initialToggle = accordion.querySelector('[aa-accordion-initial]');
    if (initialToggle) {
      const toggleId = initialToggle.getAttribute('aa-accordion-toggle');
      const initialContent = accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
      if (initialContent) {
        openAccordion(initialToggle, initialContent, accordion);
        if (isAutoplay) currentlyOpenAccordion = initialToggle;
      }
    }
    
    // Initialize autoplay
    if (isAutoplay) {
      const initialToggle = accordion.querySelector('[aa-accordion-initial]');
      currentAutoplayIndex = initialToggle ? Array.from(toggles).indexOf(initialToggle) : 0;
      
      if (window.ScrollTrigger) {
        scrollInstance = ScrollTrigger.create({
          trigger: accordion,
          start: 'top bottom',
          end: 'bottom top',
          toggleActions: 'play pause resume pause',
          onEnter: () => {
            if (isAutoplay && !progressTween) {
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
      
      if (scrollInstance?.isActive) {
        progressTween.play();
      }
    }
    
    function switchToAccordion(index) {
      if (index >= toggles.length) return;
      
      const toggle = toggles[index];
      const toggleId = toggle.getAttribute('aa-accordion-toggle');
      const content = accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
      if (!content) return;
      
      if (isAutoplay && currentlyOpenAccordion && currentlyOpenAccordion !== toggle) {
        const openToggleId = currentlyOpenAccordion.getAttribute('aa-accordion-toggle');
        const openContent = accordion.querySelector(`[aa-accordion-content="${openToggleId}"]`);
        if (openContent) {
          closeAccordion(currentlyOpenAccordion, openContent, accordion);
        }
      }
      
      const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
      if (!isActive) {
        openAccordion(toggle, content, accordion);
        currentlyOpenAccordion = toggle;
      }
      
      if (isAutoplay) {
        const autoplayDuration = parseFloat(accordion.getAttribute('aa-duration')) || 5;
        currentAutoplayIndex = index;
        startProgress(index, autoplayDuration);
      }
    }
  });

  function openAccordion(toggle, content, accordion) {
    toggle.setAttribute('aa-accordion-status', 'active');
    content.setAttribute('aa-accordion-status', 'active');
    toggle.setAttribute('aria-expanded', 'true');
    activeAccordions.add(content);

    const duration = parseFloat(content.getAttribute('aa-duration')) || 0.4;
    const accordionDelay = parseFloat(accordion.getAttribute('aa-delay')) || 0;
    
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const connectedVisual = document.querySelector(`[aa-accordion-item="${toggleId}"]`);
    
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
    
    if (connectedVisual) {
      connectedVisual.setAttribute('aa-accordion-status', 'active');
      gsap.set(connectedVisual, { visibility: 'visible' });
      
      const previouslyActiveVisual = accordion.querySelector('[aa-accordion-item][aa-accordion-status="active"]');
      
      // Handle main visual animation
      const visualAnimationType = connectedVisual.getAttribute('aa-accordion-animate');
      if (visualAnimationType) {
        const visualDuration = parseFloat(connectedVisual.getAttribute('aa-duration')) || 0.4;
        const visualEase = connectedVisual.getAttribute('aa-ease') || 'power4.inOut';
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
      
      // Handle inner animations
      const innerTimeline = timelines.get(connectedVisual);
      if (innerTimeline) {
        const playInnerAnimation = () => {
          if (accordionDelay > 0) {
            gsap.delayedCall(accordionDelay, () => innerTimeline.play());
          } else {
            innerTimeline.play();
          }
        };
        
        if (previouslyActiveVisual && previouslyActiveVisual !== connectedVisual) {
          previouslyActiveVisual.setAttribute('aa-accordion-status', 'inactive');
          
          const previousInnerTl = timelines.get(previouslyActiveVisual);
          if (previousInnerTl) {
            previousInnerTl.reverse();
            previousInnerTl.eventCallback('onReverseComplete', playInnerAnimation);
          } else {
            playInnerAnimation();
          }
        } else {
          playInnerAnimation();
        }
      }
    }
    
    refreshScrollTrigger(duration);
  }

  function closeAccordion(toggle, content, accordion) {
    toggle.setAttribute('aa-accordion-status', 'inactive');
    content.setAttribute('aa-accordion-status', 'inactive');
    toggle.setAttribute('aria-expanded', 'false');
    activeAccordions.delete(content);

    const duration = parseFloat(content.getAttribute('aa-duration')) || 0.4;
    const accordionDelay = parseFloat(accordion.getAttribute('aa-delay')) || 0;

    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const connectedVisual = document.querySelector(`[aa-accordion-item="${toggleId}"]`);

    // Reset progress bar
    const progressElement = toggle.querySelector('[aa-accordion-progress]');
    if (progressElement) {
      const progressType = progressElement.getAttribute('aa-accordion-progress') || 'width';
      gsap.set(progressElement, { [progressType]: 0 });
    }

    // Reverse content animations
    const tl = timelines.get(content);
    if (tl) tl.reverse();

    // Hide connected visual
    if (connectedVisual) {
      const visualAnimationType = connectedVisual.getAttribute('aa-accordion-animate');
      if (visualAnimationType) {
        const visualDuration = parseFloat(connectedVisual.getAttribute('aa-duration')) || 0.4;
        const visualEase = connectedVisual.getAttribute('aa-ease') || 'power4.inOut';
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

    gsap.set(content, { gridTemplateRows: '0fr' });
    
    refreshScrollTrigger(duration);
  }

  return {
    open: openAccordion,
    close: closeAccordion,
    timelines
  };
}

// Store parameters for initialization
let storedParams = null;

function createAccordionAnimations(gsap, lenis, animations, splitText) {
  storedParams = { gsap, lenis, animations, splitText };
  
  return {
    accordion: () => initializeAccordions(storedParams.lenis, storedParams.animations, storedParams.splitText)
  };
}

export { createAccordionAnimations }; 