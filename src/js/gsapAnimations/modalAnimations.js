// Define modal animations
const modalAnimations = {
  'fade': {
    opacity: 0
  },
  'fade-up': {
    opacity: 0,
    y: 20
  },
  'fade-down': {
    opacity: 0,
    y: -20
  },
  'slide-right': {
    x: 100,
    opacity: 0
  },
  'slide-left': {
    x: -100,
    opacity: 0
  },
  'scale': {
    scale: 0.8,
    opacity: 0
  }
};

// Store parameters for initialization
let storedParams = null;

// Usage: createModalAnimations(gsap, lenis, textAnimations, splitText)
// Parameters are stored for later use during initialization

function createModalTimeline(modal, backdrop, textAnimations, splitText) {
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
      animationAttr: element.getAttribute('aa-modal-animate')
    };
  });
  // Sort by order
  elementData.sort((a, b) => a.order - b.order);
  // Build timeline
  elementData.forEach(({ element, percent, animationAttr }) => {
    const duration = parseFloat(element.getAttribute('aa-duration')) || 0.5;
    const ease = element.getAttribute('aa-ease') || 'power2.out';
    const timelinePosition = percent ? `>-${percent}%` : '<';
    
    if (animationAttr && animationAttr.startsWith('text-') && textAnimations && splitText) {
      const split = element.getAttribute('aa-split') || 'lines';
      const stagger = parseFloat(element.getAttribute('aa-stagger')) || 0.01;
      
      // Set up element settings for text splitter
      element.settings = {
        ...element.settings,
        animationType: animationAttr,
        split: split,
        stagger: stagger,
        duration: duration,
        ease: ease
      };
      
      // Get the animation function using getAnimation method
      const animation = textAnimations.getAnimation(animationAttr);
      if (!animation) {
        console.warn('[ModalTimeline][Text] No animation found for:', animationAttr, 'Available:', Object.keys(textAnimations));
        return;
      }
      
      // Create the animation configuration
      const animConfig = animation(element, split, duration, stagger, 0, ease);
      
      // Use splitText with the animation configuration
      const { splitInstance } = splitText(
        element,
        split,
        false,
        (self) => {
          if (!animConfig || !animConfig.onSplit) {
            console.warn('[ModalTimeline][Text] Invalid animation configuration:', animConfig);
            return null;
          }
          const timeline = animConfig.onSplit(self);
          if (timeline) {
            tl.add(timeline, timelinePosition);
          }
          return timeline;
        }
      );
      
    } else {
      // Modal animation as before
      const animation = modalAnimations[animationAttr];
      if (animation) {
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

function initializeModals(lenis = null, textAnimations = null, splitText = null) {
  const group = document.querySelector('[aa-modal-group]');
  const backdrop = group ? group.querySelector('[aa-modal-backdrop]') : null;
  const modals = group ? group.querySelectorAll('[aa-modal-name]') : [];
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
    timelines.set(modal, createModalTimeline(modal, backdrop, textAnimations, splitText));
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
    timelines.get(modal).timeScale(1).play(0);
    removeTabTrap = trapTab(modal);
    setTimeout(() => {
      const focusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    }, 10);
  }

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetName = trigger.getAttribute('aa-modal-target');
      const modal = group ? group.querySelector(`[aa-modal-name="${targetName}"]`) : null;
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

function createModalAnimations(gsap, lenis, textAnimations, splitText) {
  // Store parameters for later use
  storedParams = { gsap, lenis, textAnimations, splitText };
  
  return {
    modal: () => initializeModals(storedParams.lenis, storedParams.textAnimations, storedParams.splitText)
  };
}

export { createModalAnimations }; 