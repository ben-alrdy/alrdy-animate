import { triggerAnimations } from '../utils/animationEventTrigger';

//
// AccordionState Class for Element Caching
//
class AccordionState {
  constructor(accordion, defaultDuration = 1) {
    this.accordion = accordion;
    this.defaultDuration = defaultDuration;
    this.toggles = [];
    this.contents = [];
    this.visuals = [];
    this.elementMap = new Map(); // toggleId -> { toggle, content, visual, progressElement }
    
    this.initializeElements();
  }
  
  initializeElements() {
    // Get all elements once
    this.toggles = Array.from(this.accordion.querySelectorAll('[aa-accordion-toggle]'));
    this.contents = Array.from(this.accordion.querySelectorAll('[aa-accordion-content]'));
    this.visuals = Array.from(this.accordion.querySelectorAll('[aa-accordion-visual]'));
    
    // Build element map for O(1) lookups
    this.toggles.forEach(toggle => {
      const toggleId = toggle.getAttribute('aa-accordion-toggle');
      const content = this.accordion.querySelector(`[aa-accordion-content="${toggleId}"]`);
      const visual = this.accordion.querySelector(`[aa-accordion-visual="${toggleId}"]`);
      const progressElement = toggle.querySelector('[aa-accordion-progress]');
      
      // Parse attributes once
      const duration = parseFloat(toggle.getAttribute('aa-duration')) || this.defaultDuration;
      const delay = parseFloat(toggle.getAttribute('aa-delay')) || 0;
      const contentDuration = content ? (parseFloat(content.getAttribute('aa-duration')) || this.defaultDuration / 2) : this.defaultDuration / 2;
      
      // Parse visual element attributes once
      const visualDuration = visual ? (parseFloat(visual.getAttribute('aa-duration')) || this.defaultDuration) : this.defaultDuration;
      const visualDelay = visual ? (parseFloat(visual.getAttribute('aa-delay')) || 0) : 0;
      const visualReverseDuration = (visualDuration + visualDelay) / 2;
      
      this.elementMap.set(toggleId, {
        toggle,
        content,
        visual,
        progressElement,
        duration,
        delay,
        contentDuration,
        reverseDuration: (duration + delay) / 2,
        visualDuration,
        visualDelay,
        visualReverseDuration
      });
    });
    
    // Setup event-based triggering for all elements
    this.setupEventTriggering();
  }
  
  setupEventTriggering() {
    // Setup event triggering for all toggles and their associated elements
    this.toggles.forEach(toggle => {
      const toggleId = toggle.getAttribute('aa-accordion-toggle');
      const elementData = this.elementMap.get(toggleId);
      if (!elementData) return;
      
      // Setup content event triggering
      if (elementData.content) {
        this.markElementsForEventTriggering(elementData.content);
      }
      
      // Setup visual event triggering
      if (elementData.visual) {
        this.markElementsForEventTriggering(elementData.visual);
      }
    });
  }
  
  markElementsForEventTriggering(container) {
    const animatedElements = [
      ...(container.hasAttribute('aa-animate') ? [container] : []),
      ...container.querySelectorAll('[aa-animate]')
    ];
    animatedElements.forEach(el => {
      el.setAttribute('aa-event-trigger', '');
    });
  }
  
  getElementData(toggleId) {
    return this.elementMap.get(toggleId);
  }
  
  getAllToggles() {
    return this.toggles;
  }
  
  getActiveToggle() {
    return this.accordion.querySelector('[aa-accordion-toggle][aa-accordion-status="active"]');
  }
  
  getActiveVisual() {
    return this.accordion.querySelector('[aa-accordion-visual][aa-accordion-status="active"]');
  }
  
  getActiveVisualData() {
    const activeVisual = this.getActiveVisual();
    if (!activeVisual) return null;
    
    // Find the toggle that corresponds to this visual
    const visualId = activeVisual.getAttribute('aa-accordion-visual');
    return this.getElementData(visualId);
  }
  
}

//
// AccordionController Base Class
//
class AccordionController {
  constructor(accordion, state, defaultDuration = 1) {
    this.accordion = accordion;
    this.state = state;
    this.defaultDuration = defaultDuration;
    this.accordionType = accordion.getAttribute('aa-accordion') || 'basic';
    this.isMulti = this.accordionType === 'multi';
    this.isAutoplay = this.accordionType === 'autoplay';
    this.isScroll = this.accordionType === 'scroll';
    this.isSingle = this.accordionType === 'single';
    
    this.setupEventDelegation();
  }
  
  setupEventDelegation() {
    // Single delegated click handler
    this.accordion.addEventListener('click', (e) => {
      const toggle = e.target.closest('[aa-accordion-toggle]');
      if (!toggle) return;
      
      this.handleToggle(toggle);
    });
    
    // Single delegated keyboard handler
    this.accordion.addEventListener('keydown', (e) => {
      const toggle = e.target.closest('[aa-accordion-toggle]');
      if (!toggle) return;
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleToggle(toggle);
      }
    });
  }
  
  handleToggle(toggle) {
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const elementData = this.state.getElementData(toggleId);
    if (!elementData) return;
    
    const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
    
    // For single type, prevent closing the active accordion
    if (isActive && this.isSingle) {
      return;
    }
    
    if (isActive) {
      this.closeAccordion(toggle, elementData);
    } else {
      this.openAccordion(toggle, elementData);
    }
  }
  
  openAccordion(toggle, elementData) {
    const { toggleId, content, visual } = elementData;
    
    // Close other accordions if not multi
    if (!this.isMulti) {
      const activeToggle = this.state.getActiveToggle();
      if (activeToggle && activeToggle !== toggle) {
        const activeToggleId = activeToggle.getAttribute('aa-accordion-toggle');
        const activeElementData = this.state.getElementData(activeToggleId);
        if (activeElementData) {
          this.closeAccordion(activeToggle, activeElementData);
        }
      }
    }
    
    // Set current accordion to active
    toggle.setAttribute('aa-accordion-status', 'active');
    
    // Set appropriate ARIA state based on content presence
    if (content) {
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      toggle.setAttribute('aria-selected', 'true');
    }
    
    // Update visual ARIA state
    if (visual) {
      if (content) {
        // Visual is secondary to content
        visual.setAttribute('aria-hidden', 'false');
      } else {
        // Visual is primary content
        visual.setAttribute('aria-hidden', 'false');
      }
    }
    
    if (content) {
      gsap.set(content, { gridTemplateRows: '1fr' });
      content.setAttribute('aa-accordion-status', 'active');
      triggerAccordionAnimations(content, 'play');
    }
    
    // Handle visual animations
    if (visual) {
      this.handleVisualOpening(visual, elementData);
    }
    
    // Refresh ScrollTrigger after animation
    gsap.delayedCall(elementData.contentDuration, () => {
      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    });
  }
  
  closeAccordion(toggle, elementData) {
    const { content, visual, contentDuration, reverseDuration } = elementData;
    
    toggle.setAttribute('aa-accordion-status', 'inactive');
    
    // Set appropriate ARIA state based on content presence
    if (content) {
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      toggle.setAttribute('aria-selected', 'false');
    }
    
    // Update visual ARIA state
    if (visual) {
      visual.setAttribute('aria-hidden', 'true');
    }
    
    if (content) {
      content.setAttribute('aa-accordion-status', 'inactive');
      gsap.set(content, { gridTemplateRows: '0fr' });
      triggerAccordionAnimations(content, 'reverse');
    }
    
    // Handle visual closing
    if (visual) {
      triggerAccordionAnimations(visual, 'reverse');
      
      // Use cached visual reverse duration
      gsap.delayedCall(elementData.visualReverseDuration, () => {
        gsap.set(visual, { visibility: 'hidden' });
        visual.setAttribute('aa-accordion-status', 'inactive');
      });
    }
    
    // Reset progress bar
    this.resetProgressBar(elementData);
    
    // Refresh ScrollTrigger after animation
    gsap.delayedCall(contentDuration, () => {
      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    });
  }
  
  handleVisualOpening(visual, elementData) {
    const previouslyActiveVisualData = this.state.getActiveVisualData();
    
    if (previouslyActiveVisualData && previouslyActiveVisualData.visual !== visual) {
      // Use cached previous visual's reverse duration
      gsap.delayedCall(previouslyActiveVisualData.visualReverseDuration, () => {
        this.startVisualAnimation(visual);
      });
    } else {
      this.startVisualAnimation(visual);
    }
  }
  
  startVisualAnimation(visual) {
    visual.setAttribute('aa-accordion-status', 'active');
    gsap.set(visual, { visibility: 'visible' });
    triggerAccordionAnimations(visual, 'play');
  }
  
  resetProgressBar(elementData) {
    const { progressElement, toggle } = elementData;
    if (!progressElement) return;
    
    const circle = toggle.querySelector('circle[aa-accordion-progress="circle"]');
    if (circle) {
      // Use direct DOM manipulation for SVG stroke properties
      circle.style.strokeDasharray = '10000';
      circle.style.strokeDashoffset = '10000';
    } else {
      const progressType = progressElement.getAttribute('aa-accordion-progress') || 'width';
      gsap.set(progressElement, { [progressType]: 0 });
    }
  }
  
  triggerAccordionAnimations(container, action) {
    triggerAccordionAnimations(container, action);
  }
}

//
// Helper Functions
//
function setupAriaAttributes(toggle, content, visual, toggleId) {
  const ariaToggleId = `accordion-toggle-${toggleId}`;
  const ariaContentId = `accordion-content-${toggleId}`;
  const ariaVisualId = `accordion-visual-${toggleId}`;
  
  // Always set up toggle
  toggle.setAttribute('id', ariaToggleId);
  toggle.setAttribute('tabindex', '0');
  
  if (content && visual) {
    // Accordion with content + visual (content takes precedence)
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', ariaContentId);
    
    content.setAttribute('id', ariaContentId);
    content.setAttribute('aria-labelledby', ariaToggleId);
    content.setAttribute('role', 'region');
    
    // Visual gets basic attributes but is secondary
    visual.setAttribute('id', ariaVisualId);
    visual.setAttribute('aria-hidden', 'true');
    
  } else if (content) {
    // Accordion with content only
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', ariaContentId);
    
    content.setAttribute('id', ariaContentId);
    content.setAttribute('aria-labelledby', ariaToggleId);
    content.setAttribute('role', 'region');
    
  } else if (visual) {
    // Tab with visual only
    toggle.setAttribute('role', 'tab');
    toggle.setAttribute('aria-selected', 'false');
    toggle.setAttribute('aria-controls', ariaVisualId);
    
    visual.setAttribute('id', ariaVisualId);
    visual.setAttribute('aria-labelledby', ariaToggleId);
    visual.setAttribute('role', 'tabpanel');
  }
}

function triggerAccordionAnimations(container, action) {
  const animatedElements = [
    ...(container.hasAttribute('aa-animate') ? [container] : []),
    ...container.querySelectorAll('[aa-animate]')
  ];
  
  triggerAnimations(animatedElements, action);
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

function initializeAccordionElements(accordion, state, animations, splitText, defaultDuration = 1) {
  const initialToggle = accordion.querySelector('[aa-accordion-initial]');
  const accordionType = accordion.getAttribute('aa-accordion') || 'basic';
  const isSingle = accordionType === 'single';
  
  // Set all toggles to inactive initially using cached elements
  state.toggles.forEach((toggle) => {
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const elementData = state.getElementData(toggleId);
    
    // Set initial states
    toggle.setAttribute('aa-accordion-status', 'inactive');
    
    if (elementData.content) {
      elementData.content.setAttribute('aa-accordion-status', 'inactive');
    }
    
    // Setup ARIA attributes for all scenarios
    setupAriaAttributes(toggle, elementData.content, elementData.visual, toggleId);
    
    if (elementData.visual) {
      elementData.visual.setAttribute('aa-accordion-status', 'inactive');
      gsap.set(elementData.visual, { visibility: 'hidden' });
    }
  });
  
  // Set CSS variables for content elements
  state.contents.forEach((content) => {
    const contentDuration = parseFloat(content.getAttribute('aa-duration')) || defaultDuration / 2;
    content.style.setProperty('--aa-duration', `${contentDuration}s`);
  });
  
  // Determine which accordion to open initially
  let toggleToOpen = initialToggle;
  
  // For single type, ensure at least one accordion is open
  if (isSingle && !toggleToOpen && state.toggles.length > 0) {
    toggleToOpen = state.toggles[0];
  }
  
  // Open initial accordion if specified or required
  if (toggleToOpen) {
    const toggleToOpenId = toggleToOpen.getAttribute('aa-accordion-toggle');
    const elementData = state.getElementData(toggleToOpenId);
    
    if (elementData) {
      // Add a small delay to ensure all animations are properly set up before opening
      gsap.delayedCall(0.1, () => {
        // Set current accordion to active
        toggleToOpen.setAttribute('aa-accordion-status', 'active');
        
        // Set appropriate ARIA state based on content presence
        if (elementData.content) {
          toggleToOpen.setAttribute('aria-expanded', 'true');
        } else {
          toggleToOpen.setAttribute('aria-selected', 'true');
        }
        
        // Update visual ARIA state
        if (elementData.visual) {
          elementData.visual.setAttribute('aria-hidden', 'false');
        }
        
        if (elementData.content) {
          gsap.set(elementData.content, { gridTemplateRows: '1fr' });
          elementData.content.setAttribute('aa-accordion-status', 'active');
          triggerAccordionAnimations(elementData.content, 'play');
        }
        
        // Handle visual animations
        if (elementData.visual) {
          elementData.visual.setAttribute('aa-accordion-status', 'active');
          gsap.set(elementData.visual, { visibility: 'visible' });
          triggerAccordionAnimations(elementData.visual, 'play');
        }
      });
    }
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
        const circle = toggle.querySelector('circle[aa-accordion-progress="circle"]');
        if (circle) {
          const radius = parseFloat(circle.getAttribute('r')) || 25;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (clampedProgress * circumference);
          circle.style.strokeDashoffset = offset;
        }
      } else {
        gsap.set(progressElement, { [progressType]: `${clampedProgress * 100}%` });
      }
    } else {
      // Reset progress for inactive accordions
      if (progressType === 'circle') {
        const circle = toggle.querySelector('circle[aa-accordion-progress="circle"]');
        if (circle) {
          const radius = parseFloat(circle.getAttribute('r')) || 25;
          const circumference = 2 * Math.PI * radius;
          circle.style.strokeDashoffset = circumference;
        }
      } else {
        gsap.set(progressElement, { [progressType]: '0%' });
      }
    }
  });
}



// 
// Core accordion functions (used by all types) - Now handled by AccordionController
//


// 
// Main accordion types
// 

// Initialize basic/multi accordion - Now handled by AccordionController base class
// No additional setup needed as event delegation handles everything

// Initialize autoplay accordion
function initializeAutoplayAccordion(accordion, state, controller, animations, splitText, defaultDuration = 1) {
  let progressTween = null;
  let currentAutoplayIndex = 0;
  let currentlyOpenAccordion = null;
  let scrollInstance = null;
  
  // Check for initial toggle and set currentlyOpenAccordion
  const initialToggle = accordion.querySelector('[aa-accordion-initial]');
  if (initialToggle) {
    currentlyOpenAccordion = initialToggle;
    currentAutoplayIndex = state.toggles.indexOf(initialToggle);
    
    // Ensure initial accordion is properly opened with animations
    const initialToggleId = initialToggle.getAttribute('aa-accordion-toggle');
    const elementData = state.getElementData(initialToggleId);
    if (elementData) {
      // Set initial accordion to active
      initialToggle.setAttribute('aa-accordion-status', 'active');
      
      // Set appropriate ARIA state based on content presence
      if (elementData.content) {
        initialToggle.setAttribute('aria-expanded', 'true');
      } else {
        initialToggle.setAttribute('aria-selected', 'true');
      }
      
      // Update visual ARIA state
      if (elementData.visual) {
        elementData.visual.setAttribute('aria-hidden', 'false');
      }
      
      if (elementData.content) {
        gsap.set(elementData.content, { gridTemplateRows: '1fr' });
        elementData.content.setAttribute('aa-accordion-status', 'active');
        triggerAccordionAnimations(elementData.content, 'play');
      }
      
      // Handle visual animations
      if (elementData.visual) {
        elementData.visual.setAttribute('aa-accordion-status', 'active');
        gsap.set(elementData.visual, { visibility: 'visible' });
        triggerAccordionAnimations(elementData.visual, 'play');
      }
    }
  }
  
  // Override controller's handleToggle for autoplay-specific logic
  const originalHandleToggle = controller.handleToggle.bind(controller);
  controller.handleToggle = (toggle) => {
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const elementData = state.getElementData(toggleId);
    if (!elementData) return;
    
    const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
    const hasInitialToggle = accordion.querySelector('[aa-accordion-initial]');
    
    if (progressTween?.isActive()) {
      const currentToggleIndex = state.toggles.indexOf(toggle);
      if (currentToggleIndex === currentAutoplayIndex) return;
    }
    
    stopAutoplay();
    
    // Prevent closing active accordion if it has initial toggle
    if (isActive && hasInitialToggle) {
      return;
    }
    
    if (isActive) {
      controller.closeAccordion(toggle, elementData);
    } else {
      // Close other accordions
      state.toggles.forEach(otherToggle => {
        if (otherToggle !== toggle) {
          const otherId = otherToggle.getAttribute('aa-accordion-toggle');
          const otherElementData = state.getElementData(otherId);
          if (otherToggle.getAttribute('aa-accordion-status') === 'active' && otherElementData) {
            controller.closeAccordion(otherToggle, otherElementData);
          }
        }
      });
      controller.openAccordion(toggle, elementData);
      currentlyOpenAccordion = toggle;
    }
    
    if (scrollInstance?.isActive) {
      const clickedIndex = state.toggles.indexOf(toggle);
      if (clickedIndex !== -1) switchToAccordion(clickedIndex);
    }
  };
  
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
    
    const toggle = state.toggles[index];
    const elementData = state.getElementData(toggle.getAttribute('aa-accordion-toggle'));
    if (!elementData) return;
    
    // Check for circular progress first - look directly on toggle like old implementation
    const circle = toggle.querySelector('circle[aa-accordion-progress="circle"]');
    if (circle) {
      const progressEase = circle.getAttribute('aa-ease') || 'power1.inOut';
      
      // Calculate circumference for stroke-dasharray
      const radius = parseFloat(circle.getAttribute('r')) || 25;
      const circumference = 2 * Math.PI * radius;
      
      // Set initial state (empty circle)
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = circumference;
      
      progressTween = gsap.to(circle, {
        strokeDashoffset: 0,
        duration,
        ease: progressEase,
        onComplete: () => {
          if (scrollInstance?.isActive) {
            const nextIndex = (index + 1) % state.toggles.length;
            switchToAccordion(nextIndex);
          }
        },
        paused: !scrollInstance?.isActive
      });
    } else if (elementData.progressElement) {
      // Handle linear progress (width/height) - but not circle
      const progressType = elementData.progressElement.getAttribute('aa-accordion-progress') || 'width';
      const progressEase = elementData.progressElement.getAttribute('aa-ease') || 'power1.inOut';
      
      // Skip if it's a circle type (should have been handled above)
      if (progressType === 'circle') {
        // No progress bar - just use a simple timer
        progressTween = gsap.delayedCall(duration, () => {
          if (scrollInstance?.isActive) {
            const nextIndex = (index + 1) % state.toggles.length;
            switchToAccordion(nextIndex);
          }
        });
      } else {
        gsap.set(elementData.progressElement, { [progressType]: 0 });
        
        progressTween = gsap.to(elementData.progressElement, {
          [progressType]: '100%',
          duration,
          ease: progressEase,
          onComplete: () => {
            if (scrollInstance?.isActive) {
              const nextIndex = (index + 1) % state.toggles.length;
              switchToAccordion(nextIndex);
            }
          },
          paused: !scrollInstance?.isActive
        });
      }
    } else {
      // No progress bar - just use a simple timer
      progressTween = gsap.delayedCall(duration, () => {
        if (scrollInstance?.isActive) {
          const nextIndex = (index + 1) % state.toggles.length;
          switchToAccordion(nextIndex);
        }
      });
    }
    
    if (scrollInstance?.isActive) {
      progressTween.play();
    }
  }
  
  function switchToAccordion(index) {
    if (index >= state.toggles.length) return;
    
    const toggle = state.toggles[index];
    const toggleId = toggle.getAttribute('aa-accordion-toggle');
    const elementData = state.getElementData(toggleId);
    if (!elementData) return;
    
    if (currentlyOpenAccordion && currentlyOpenAccordion !== toggle) {
      const openToggleId = currentlyOpenAccordion.getAttribute('aa-accordion-toggle');
      const openElementData = state.getElementData(openToggleId);
      if (openElementData) {
        controller.closeAccordion(currentlyOpenAccordion, openElementData);
      }
    }
    
    const isActive = toggle.getAttribute('aa-accordion-status') === 'active';
    if (!isActive) {
      controller.openAccordion(toggle, elementData);
      currentlyOpenAccordion = toggle;
    }
    
    const autoplayDuration = parseFloat(accordion.getAttribute('aa-duration')) || 5;
    currentAutoplayIndex = index;
    startProgress(index, autoplayDuration);
  }
}

// Initialize scroll accordion with optimized approach
function initializeScrollAccordion(accordion, state, controller, defaultDuration = 1) {
  if (!window.ScrollTrigger) return;
  
  // Get configuration
  const scrollStart = accordion.getAttribute('aa-scroll-start') || 'top 20%';
  const distanceAttr = accordion.getAttribute('aa-distance') || '30';
  const scrubValue = accordion.getAttribute('aa-scrub') || 'true';
  const accordionCount = state.toggles.length;
  
  // Calculate scroll distance (convert vh to pixels for ScrollTrigger)
  const totalScrollDistance = accordionCount * parseFloat(distanceAttr) * window.innerHeight / 100;
  
  // Check for initial accordion
  const initialAccordion = accordion.querySelector('[aa-accordion-initial]');
  const hasInitialAccordion = initialAccordion && state.toggles[0] === initialAccordion;
  
  // Track current active accordion
  let currentActiveIndex = hasInitialAccordion ? 0 : -1;
  
  
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
          const prevToggle = state.toggles[currentActiveIndex];
          const prevToggleId = prevToggle.getAttribute('aa-accordion-toggle');
          const prevElementData = state.getElementData(prevToggleId);
          if (prevElementData) {
            controller.closeAccordion(prevToggle, prevElementData);
          }
        }
        
        // Open new accordion
        if (newActiveIndex >= 0) {
          const newToggle = state.toggles[newActiveIndex];
          const newToggleId = newToggle.getAttribute('aa-accordion-toggle');
          const newElementData = state.getElementData(newToggleId);
          if (newElementData) {
            controller.openAccordion(newToggle, newElementData);
          }
        }
        
        currentActiveIndex = newActiveIndex;
      }
      
      // Update progress bars efficiently
      updateProgressBars(state.toggles, newActiveIndex, progress, accordionCount);
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
  
  // Override the base controller's handleToggle method for scroll-type accordions
  // Store the original method and replace it with our scroll-to logic
  const originalHandleToggle = controller.handleToggle.bind(controller);
  
  controller.handleToggle = (toggle) => {
    const toggleIndex = state.toggles.indexOf(toggle);
    
    if (toggleIndex === -1) {
      return originalHandleToggle(toggle);
    }
    
    // Calculate target scroll position
    const scrollTriggerInstance = scrollTrigger;
    if (!scrollTriggerInstance) return;
    
    const distancePerAccordion = totalScrollDistance / accordionCount;
    // Add a small offset to ensure the accordion actually opens
    // We need to scroll slightly into the accordion's section, not just to its start
    const accordionOffset = distancePerAccordion * 0.05; // 5% into the accordion section
    const targetScrollY = scrollTriggerInstance.start + (toggleIndex * distancePerAccordion) + accordionOffset;
    
    // Use Lenis if available, otherwise fall back to GSAP
    if (window.lenis) {
      // Use Lenis for smooth scrolling with quartic easing
      window.lenis.scrollTo(targetScrollY, {
        duration: 0.6,
        offset: 0
      });
    } else if (gsap.ScrollToPlugin) {
      // Fallback to GSAP ScrollToPlugin
      gsap.to(window, {
        duration: 0.6,
        scrollTo: { y: targetScrollY, autoKill: false },
        ease: "power2.inOut"
      });
    } else {
      // Last resort: direct scroll
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    }
  };
  
  
}

// 
// Main initialization function
// 

function initializeAccordion(accordion, animations = null, splitText = null, defaultDuration = 1, accordionType = null) {
  // Auto-assign IDs if not provided
  autoAssignIds(accordion);
  
  // Create state and controller
  const state = new AccordionState(accordion, defaultDuration);
  const controller = new AccordionController(accordion, state, defaultDuration);
  
  // Initialize accordion elements: states and animations
  initializeAccordionElements(accordion, state, animations, splitText, defaultDuration);
  
  // Initialize based on accordion type
  if (accordionType === 'scroll') {
    initializeScrollAccordion(accordion, state, controller, defaultDuration);
  } else if (accordionType === 'autoplay') {
    initializeAutoplayAccordion(accordion, state, controller, animations, splitText, defaultDuration);
  }
  // Basic and multi accordions are handled by the base controller
}

function createAccordionAnimations(gsap, animations, splitText, defaultDuration = 1) {
  return {
    accordion: (accordion, accordionType = null) => {
      // Initialize accordion
      initializeAccordion(accordion, animations, splitText, defaultDuration, accordionType);
    }
  };
}

export { createAccordionAnimations }; 