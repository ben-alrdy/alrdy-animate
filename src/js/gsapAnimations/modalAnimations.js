import { triggerAnimations } from '../utils/animationEventTrigger';

function initializeModals(lenis = null, animations = null, splitText = null, group = null, defaultDuration = 1) {
  const backdrop = group.querySelector('[aa-modal-backdrop]');
  const modals = group.querySelectorAll('[aa-modal-name]');
  const triggers = document.querySelectorAll('[aa-modal-target]');
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
    
    // Mark nested aa-animate elements for event-based triggering
    const animatedElements = [
      ...(modal.hasAttribute('aa-animate') ? [modal] : []),
      ...modal.querySelectorAll('[aa-animate]')
    ];
    
    animatedElements.forEach(el => {
      el.setAttribute('aa-event-trigger', '');
    });
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
    // Trigger reverse animations (automatically 2x speed) and get max duration
    const maxDuration = triggerModalAnimations(modal, 'reverse', defaultDuration, backdrop);
    
    window.gsap.delayedCall(maxDuration, () => {
      modal.style.visibility = 'hidden';
      modal.style.display = 'none';
      modal.setAttribute('aa-modal-status', 'not-active');
      group.style.visibility = 'hidden';
      group.setAttribute('aa-modal-group-status', 'not-active');
      unlockScroll();
      if (removeTabTrap) removeTabTrap();
      activeModal = null;
    });
  }

  function openModal(modal) {
    group.style.visibility = 'visible';
    group.setAttribute('aa-modal-group-status', 'active');
    modal.style.visibility = 'visible';
    modal.style.display = 'flex';
    modal.setAttribute('aa-modal-status', 'active');
    lockScroll();
    activeModal = modal;
    
    // Trigger animations (automatically 1x speed) and get max duration
    const maxDuration = triggerModalAnimations(modal, 'play', defaultDuration, backdrop);
    
    window.gsap.delayedCall(maxDuration, () => {
      const focusable = modal.querySelector(
        'input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    });
    
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
    close: closeModal
  };
}

function triggerModalAnimations(modal, action, defaultDuration = 1, backdrop = null) {
  // Trigger animations on all aa-animate elements
  const animatedElements = [
    ...(modal.hasAttribute('aa-animate') ? [modal] : []),
    ...modal.querySelectorAll('[aa-animate]')
  ];
  
  triggerAnimations(animatedElements, action);
  
  // Calculate max duration for modal-specific timing (modal element only)
  const modalDuration = parseFloat(modal.getAttribute('aa-duration')) || defaultDuration;
  const modalDelay = parseFloat(modal.getAttribute('aa-delay')) || 0;
  const timeScale = action === 'reverse' ? 2 : 1;
  const maxDuration = (modalDuration + modalDelay) / timeScale;
  
  // Handle backdrop separately (modal-specific)
  if (backdrop && window.gsap) {
    if (action === 'play') {
      window.gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'none' });
    } else {
      // Backdrop fades out AFTER modal element animation completes
      window.gsap.to(backdrop, { autoAlpha: 0, duration: 0.4, delay: maxDuration - 0.4, ease: 'none' });
    }
  }
  
  return maxDuration;
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

// Usage: createModalAnimations(gsap, lenis, animations, splitText, defaultDuration)
function createModalAnimations(gsap, lenis, animations, splitText, defaultDuration = 1) {
  return {
    modal: (group) => initializeModals(lenis, null, null, group, defaultDuration)
  };
}

export { createModalAnimations }; 