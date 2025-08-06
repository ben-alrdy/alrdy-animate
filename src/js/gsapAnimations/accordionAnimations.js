// Define accordion animations for content elements
const accordionAnimations = {
  'fade': { opacity: 0 },
  'fade-up': { opacity: 0, yPercent: 30 },
  'fade-down': { opacity: 0, yPercent: -30 },
  'fade-left': { opacity: 0, xPercent: 30 },
  'fade-right': { opacity: 0, xPercent: -30 },
  'slide-up': { yPercent: 110 },
  'slide-down': { yPercent: -110 },
  'slide-left': { xPercent: 110 },
  'slide-right': { xPercent: -110 },
  'scale': { scale: 0.8, opacity: 0, transformOrigin: 'center' }
};

function createAccordionTimeline(accordionContent, animations, splitText) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  
  const animatedElements = [
    ...(accordionContent.hasAttribute('aa-accordion-animate') ? [accordionContent] : []),
    ...accordionContent.querySelectorAll('[aa-accordion-animate]')
  ];
  
  // Map elements to objects with parsed order and percent
  const elementData = Array.from(animatedElements).map(element => {
    const orderAttr = element.getAttribute('aa-accordion-order') || '';
    const [orderStr, percentStr] = orderAttr.split('-');
    return {
      element,
      order: parseInt(orderStr) || 0,
      percent: percentStr ? percentStr : null,
      animationType: element.getAttribute('aa-accordion-animate')
    };
  });

  // Sort by order
  elementData.sort((a, b) => a.order - b.order);

  // Build timeline
  elementData.forEach(({ element, percent, animationType }) => {
    const duration = parseFloat(element.getAttribute('aa-duration')) || 0.5;
    const ease = element.getAttribute('aa-ease') || 'power2.out';
    const distance = parseFloat(element.getAttribute('aa-distance')) || 1;
    const timelinePosition = percent ? `>-${percent}%` : '<';
    const baseType = animationType ? (animationType.includes('-') ? animationType.split('-')[0] : animationType) : null;

    if (baseType === 'text' && animations && animations.text && splitText) {
      const split = element.getAttribute('aa-split') || 'lines';
      const stagger = parseFloat(element.getAttribute('aa-stagger')) || 0.01;
      
      // Get the animation function using baseType
      const baseTextAnim = animationType.replace(/-clip|-lines|-words|-chars$/, '');
      const animation = animations.text[baseTextAnim];
      if (!animation) {
        console.warn('[AccordionTimeline][Text] No animation found for:', animationType, 'Available:', Object.keys(animations.text));
        return;
      }
      
      // Create the animation configuration and add to timeline
      const animConfig = animation(element, split, duration, stagger, 0, ease);
      
      // Calculate absolute position instead of using percentage
      let position = '<';
      if (percent) {
        // Convert percentage to absolute time
        const prevEndTime = tl.recent() ? tl.recent().endTime() : 0;
        const prevStartTime = tl.recent() ? tl.recent().startTime() : 0;
        const prevDuration = prevEndTime - prevStartTime;
        position = prevStartTime + (prevDuration * (parseInt(percent) / 100));
      } else {
        // For elements without percentage, use the default timeline position
        position = timelinePosition;
      }

      splitText(element, split, false, (self) => {
        const timeline = animConfig.onSplit(self);
        tl.add(timeline, position);
        return timeline;
      }, animationType);
    } else if (animations && animations[baseType]) {
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
      if (animationTimeline) {
        tl.add(animationTimeline, timelinePosition);
      }
    } else {
      // Simple accordion animations
      const animation = accordionAnimations[animationType];
      if (animationType.includes('custom')) {
        tl.to(element, { 
          x: 0,
          y: 0,
          xPercent: 0, 
          yPercent: 0, 
          opacity: 1, 
          scale: 1,
          duration, 
          ease 
        }, timelinePosition);
      } else if (animation) {
        tl.from(element, { ...animation, duration, ease }, timelinePosition);
      }
    }
  });
  return tl;
}

function initializeAccordions(lenis = null, animations = null, splitText = null) {
  const accordions = document.querySelectorAll('[aa-animate="accordion"], [aa-animate="accordion-multi"]');
  const timelines = new Map();
  let activeAccordions = new Set();

  accordions.forEach(accordion => {
    const isMulti = accordion.getAttribute('aa-animate') === 'accordion-multi';
    const toggles = accordion.querySelectorAll('[aa-accordion-toggle]');
    const contents = accordion.querySelectorAll('[aa-accordion-content]');
    
    // Initialize accordion content
    contents.forEach(content => {
      content.style.overflow = 'hidden';
      content.style.height = '0px';
      
      // Create timeline immediately and set initial state
      const tl = createAccordionTimeline(content, animations, splitText);
      timelines.set(content, tl);
      
      // Set initial state for animated elements
      const animatedElements = [
        ...(content.hasAttribute('aa-accordion-animate') ? [content] : []),
        ...content.querySelectorAll('[aa-accordion-animate]')
      ];
      
      animatedElements.forEach(element => {
        const animationType = element.getAttribute('aa-accordion-animate');
        const animation = accordionAnimations[animationType];
        
        if (animationType.includes('custom')) {
          gsap.set(element, { 
            x: 0,
            y: 0,
            xPercent: 0, 
            yPercent: 0, 
            opacity: 0, 
            scale: 0.8
          });
        } else if (animation) {
          gsap.set(element, animation);
        }
      });
    });

    // Initialize toggles
    toggles.forEach((toggle, index) => {
      toggle.setAttribute('aa-accordion-toggle', 'not-active');
      
      // Add ARIA attributes for accessibility
      const content = toggle.nextElementSibling;
      if (content && content.hasAttribute('aa-accordion-content')) {
        const toggleId = `accordion-toggle-${index}`;
        const contentId = `accordion-content-${index}`;
        
        toggle.setAttribute('id', toggleId);
        content.setAttribute('id', contentId);
        
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', contentId);
        toggle.setAttribute('tabindex', '0');
        toggle.setAttribute('role', 'button');
        content.setAttribute('aria-labelledby', toggleId);
        content.setAttribute('role', 'region');
      }
      
      // Handle click and keyboard events
      const handleToggle = () => {
        const content = toggle.nextElementSibling;
        if (!content || !content.hasAttribute('aa-accordion-content')) return;
        
        const isActive = toggle.getAttribute('aa-accordion-toggle') === 'active';
        
        if (isActive) {
          // Close accordion
          closeAccordion(toggle, content, accordion);
        } else {
          // Open accordion
          if (!isMulti) {
            // Close all other accordions in this group
            toggles.forEach(otherToggle => {
              if (otherToggle !== toggle) {
                const otherContent = otherToggle.nextElementSibling;
                if (otherContent && otherContent.hasAttribute('aa-accordion-content')) {
                  const otherIsActive = otherToggle.getAttribute('aa-accordion-toggle') === 'active';
                  if (otherIsActive) {
                    closeAccordion(otherToggle, otherContent, accordion);
                  }
                }
              }
            });
          }
          openAccordion(toggle, content, accordion);
        }
      };

      toggle.addEventListener('click', handleToggle);
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      });
    });
  });

  function openAccordion(toggle, content, accordion) {
    toggle.setAttribute('aa-accordion-toggle', 'active');
    content.setAttribute('aa-accordion-content', 'active');
    toggle.setAttribute('aria-expanded', 'true');
    activeAccordions.add(content);

    // Get accordion expansion settings
    const duration = parseFloat(accordion.getAttribute('aa-duration')) || 0.4;
    const ease = accordion.getAttribute('aa-ease') || 'power4.inOut';

    // Get accordion delay for inner animations
    const accordionDelay = parseFloat(accordion.getAttribute('aa-delay')) || 0;
    
    // Animate height expansion
    gsap.to(content, {
      height: 'auto',
      duration,
      ease,
      onStart: () => {
        // Play content animations after the specified delay
        if (accordionDelay > 0) {
          gsap.delayedCall(accordionDelay, () => {
            const tl = timelines.get(content);
            if (tl) {
              tl.play();
            }
          });
        } else {
          // Play content animations immediately when accordion starts opening
          const tl = timelines.get(content);
          if (tl) {
            tl.play();
          }
        }
      },
      onComplete: () => {
        // Refresh ScrollTrigger after accordion opens
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
      }
    });
  }

  function closeAccordion(toggle, content, accordion) {
    toggle.setAttribute('aa-accordion-toggle', 'not-active');
    content.setAttribute('aa-accordion-content', 'not-active');
    toggle.setAttribute('aria-expanded', 'false');
    activeAccordions.delete(content);

    // Get accordion expansion settings
    const duration = parseFloat(accordion.getAttribute('aa-duration')) || 0.6;
    const ease = accordion.getAttribute('aa-ease') || 'power2.out';

    // Reverse content animations first
    const tl = timelines.get(content);
    if (tl) {
      tl.reverse();
    }

    // Animate height collapse
    gsap.to(content, {
      height: '0px',
      duration,
      ease,
      onComplete: () => {
        // Refresh ScrollTrigger after accordion closes
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
      }
    });
  }

  return {
    open: openAccordion,
    close: closeAccordion,
    timelines
  };
}

// Store parameters for initialization
let storedParams = null;

// Usage: createAccordionAnimations(gsap, lenis, animations, splitText)
// Parameters are stored for later use during initialization
function createAccordionAnimations(gsap, lenis, animations, splitText) {
  // Store parameters for later use
  storedParams = { gsap, lenis, animations, splitText };
  
  return {
    accordion: () => initializeAccordions(storedParams.lenis, storedParams.animations, storedParams.splitText)
  };
}

export { createAccordionAnimations }; 