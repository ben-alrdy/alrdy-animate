// Define modal animations
const modalAnimations = {
  'fade': { opacity: 0 },
  'fade-up': { opacity: 0, yPercent: 10 },
  'fade-down': { opacity: 0, yPercent: -10 },
  'fade-left': { opacity: 0, xPercent: 10 },
  'fade-right': { opacity: 0, xPercent: -10 },
  'slide-up': { yPercent: 110 },
  'slide-down': { yPercent: -110 },
  'slide-left': { xPercent: 110 },
  'slide-right': { xPercent: -110 },
  'scale': { scale: 0.8, opacity: 0 }
};

function createModalTimeline(modal, backdrop, animations, splitText) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  if (backdrop) {
    tl.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' });
  }
  const animatedElements = [
    ...(modal.hasAttribute('aa-modal-animate') ? [modal] : []),
    ...modal.querySelectorAll('[aa-modal-animate]')
  ];
  // Map elements to objects with parsed order and percent
  const elementData = Array.from(animatedElements).map(element => {
    const orderAttr = element.getAttribute('aa-modal-order') || '';
    const [orderStr, percentStr] = orderAttr.split('-');
    return {
      element,
      order: parseInt(orderStr) || 0,
      percent: percentStr ? percentStr : null,
      animationType: element.getAttribute('aa-modal-animate')
    };
  });

  // Sort by order
  elementData.sort((a, b) => a.order - b.order);

  // Build timeline
  elementData.forEach(({ element, percent, animationType }) => {
    const duration = parseFloat(element.getAttribute('aa-duration')) || 0.5;
    const ease = element.getAttribute('aa-ease') || 'power2.out';
    const delay = parseFloat(element.getAttribute('aa-delay')) || 0;
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
        console.warn('[ModalTimeline][Text] No animation found for:', animationType, 'Available:', Object.keys(animations.text));
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
          animationTimeline = animations.appear(element, duration, ease, delay, distance, animationType);
          break;
        case 'reveal':
          animationTimeline = animations.reveal(element, duration, ease, delay, animationType);
          break;
        case 'counter':
          animationTimeline = animations.counter(element, duration, ease, delay, animationType);
          break;
      }
      if (animationTimeline) {
        tl.add(animationTimeline, timelinePosition);
      }
    } else {
      // Simple modal animations
      const animation = modalAnimations[animationType];
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

function trapTab(modal) {
  function handler(e) {
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

function initializeModals(lenis = null, animations = null, splitText = null, group = null) {
  const backdrop = group.querySelector('[aa-modal-backdrop]');
  const modals = group.querySelectorAll('[aa-modal-name]');
  const triggers = document.querySelectorAll('[aa-modal-target]');
  const timelines = new Map();
  let activeModal = null;
  let removeTabTrap = null;

  // Initialization: set all to hidden, but editable in Webflow
  group.style.display = 'flex';
  group.style.visibility = 'hidden';
  group.setAttribute('aa-modal-group-status', 'not-active');
  
  modals.forEach(modal => {
    modal.style.visibility = 'hidden';
    modal.style.display = 'none';
    modal.setAttribute('aa-modal-status', 'not-active');
    timelines.set(modal, null); // Only create timeline on first open, cache it
  });

  function lockScroll() {
    if (lenis) {
      lenis.stop();
    } else {
      document.body.style.overflow = 'hidden';
    }
  }
  function unlockScroll() {
    if (lenis) {
      lenis.start();
    } else {
      document.body.style.overflow = '';
    }
  }

  function closeModal(modal) {
    const tl = timelines.get(modal);
    tl.eventCallback('onReverseComplete', () => {
      modal.style.visibility = 'hidden';
      modal.style.display = 'none';
      modal.setAttribute('aa-modal-status', 'not-active');
      group.style.visibility = 'hidden';
      group.setAttribute('aa-modal-group-status', 'not-active');
      unlockScroll();
      if (removeTabTrap) removeTabTrap();
      activeModal = null;
      tl.eventCallback('onReverseComplete', null);
    });
    tl.timeScale(2).reverse();
  }

  function openModal(modal) {
    group.style.visibility = 'visible';
    group.setAttribute('aa-modal-group-status', 'active');
    modal.style.visibility = 'visible';
    modal.style.display = 'flex';
    modal.setAttribute('aa-modal-status', 'active');
    lockScroll();
    activeModal = modal;
    
    // Get or create timeline
    let tl = timelines.get(modal);
    if (!tl) {
      tl = createModalTimeline(modal, backdrop, animations, splitText);
      timelines.set(modal, tl);
    }
    
    // Reset any previous callbacks and set up new one
    tl.eventCallback('onComplete', null);  // Clear previous callback
    tl.eventCallback('onComplete', () => {
      const focusable = modal.querySelector(
        'input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    });
    
    tl.timeScale(1).play();
    
    removeTabTrap = trapTab(modal);
  }

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetName = trigger.getAttribute('aa-modal-target');
      const modal = group.querySelector(`[aa-modal-name="${targetName}"]`);
      if (activeModal) closeModal(activeModal);
      if (modal) openModal(modal);
    });
  });

  document.querySelectorAll('[aa-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (activeModal) closeModal(activeModal);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activeModal) {
      closeModal(activeModal);
    }
  });

  return {
    open: openModal,
    close: closeModal,
    timelines
  };
}

// Store parameters for initialization
let storedParams = null;

// Usage: createModalAnimations(gsap, lenis, animations, splitText)
// Parameters are stored for later use during initialization
function createModalAnimations(gsap, lenis, animations, splitText) {
  // Store parameters for later use
  storedParams = { gsap, lenis, animations, splitText };
  
  return {
    modal: (group) => initializeModals(storedParams.lenis, storedParams.animations, storedParams.splitText, group)
  };
}

export { createModalAnimations }; 