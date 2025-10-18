import { triggerAnimations } from '../utils/animationEventTrigger';

//
// ModalState Class for Element Caching
//
class ModalState {
  constructor(group, defaultDuration = 1) {
    this.group = group;
    this.defaultDuration = defaultDuration;
    this.backdrop = null;
    this.modals = [];
    this.triggers = [];
    this.modalMap = new Map(); // modalName -> { modal, triggers[], duration, delay, animatedElements }
    
    this.initializeElements();
  }
  
  initializeElements() {
    // Get all elements once
    this.backdrop = this.group.querySelector('[aa-modal-backdrop]');
    this.modals = Array.from(this.group.querySelectorAll('[aa-modal-name]'));
    this.triggers = Array.from(document.querySelectorAll('[aa-modal-target]'));
    
    // Build modal map for O(1) lookups
    this.modals.forEach(modal => {
      const modalName = modal.getAttribute('aa-modal-name');
      const modalTriggers = this.triggers.filter(trigger => 
        trigger.getAttribute('aa-modal-target') === modalName
      );
      
      // Parse attributes once
      const duration = parseFloat(modal.getAttribute('aa-duration')) || this.defaultDuration;
      const delay = parseFloat(modal.getAttribute('aa-delay')) || 0;
      
      // Get animated elements within this modal
      const animatedElements = [
        ...(modal.hasAttribute('aa-animate') ? [modal] : []),
        ...modal.querySelectorAll('[aa-animate]')
      ];
      
      // Mark animated elements for event-based triggering
      animatedElements.forEach(el => {
        el.setAttribute('aa-event-trigger', '');
      });
      
      this.modalMap.set(modalName, {
        modal,
        triggers: modalTriggers,
        duration,
        delay,
        animatedElements
      });
    });
  }
  
  getModalByName(modalName) {
    return this.modalMap.get(modalName);
  }
  
  getActiveModal() {
    return this.group.querySelector('[aa-modal-name][aa-modal-status="active"]');
  }
  
  getAllModals() {
    return this.modals;
  }
  
  getBackdrop() {
    return this.backdrop;
  }
}

//
// ModalController Class
//
class ModalController {
  constructor(group, state, lenis, defaultDuration = 1) {
    this.group = group;
    this.state = state;
    this.lenis = lenis;
    this.defaultDuration = defaultDuration;
    this.activeModal = null;
    this.removeTabTrap = null;
    
    this.setupEventDelegation();
  }
  
  setupEventDelegation() {
    // Setup click handlers for triggers
    this.state.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const targetName = trigger.getAttribute('aa-modal-target');
        const modalData = this.state.getModalByName(targetName);
        if (this.activeModal) this.closeModal();
        if (modalData) this.openModal(targetName);
      });
    });
    
    // Setup click handlers for close buttons
    document.querySelectorAll('[aa-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.activeModal) this.closeModal();
      });
    });
    
    // Setup keyboard handler for Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeModal();
      }
    });
  }
  
  lockScroll() {
    if (this.lenis) {
      this.lenis.stop();
    } else {
      document.body.style.overflow = 'hidden';
    }
  }
  
  unlockScroll() {
    if (this.lenis) {
      this.lenis.start();
    } else {
      document.body.style.overflow = '';
    }
  }
  
  openModal(modalName) {
    const modalData = this.state.getModalByName(modalName);
    if (!modalData) return;
    
    const { modal } = modalData;
    
    this.group.style.visibility = 'visible';
    this.group.setAttribute('aa-modal-group-status', 'active');
    modal.style.visibility = 'visible';
    modal.style.display = 'flex';
    modal.setAttribute('aa-modal-status', 'active');
    this.lockScroll();
    this.activeModal = modal;
    
    // Trigger animations (automatically 1x speed) and get max duration
    const maxDuration = triggerModalAnimations(modal, 'play', this.defaultDuration, this.state.getBackdrop());
    
    window.gsap.delayedCall(maxDuration, () => {
      const focusable = modal.querySelector(
        'input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    });
    
    this.removeTabTrap = trapTab(modal);
  }
  
  closeModal() {
    if (!this.activeModal) return;
    
    const modal = this.activeModal;
    const modalName = modal.getAttribute('aa-modal-name');
    const modalData = this.state.getModalByName(modalName);
    if (!modalData) return;
    
    // Trigger reverse animations (automatically 2x speed) and get max duration
    const maxDuration = triggerModalAnimations(modal, 'reverse', this.defaultDuration, this.state.getBackdrop());
    
    window.gsap.delayedCall(maxDuration, () => {
      modal.style.visibility = 'hidden';
      modal.style.display = 'none';
      modal.setAttribute('aa-modal-status', 'not-active');
      this.group.style.visibility = 'hidden';
      this.group.setAttribute('aa-modal-group-status', 'not-active');
      this.unlockScroll();
      if (this.removeTabTrap) this.removeTabTrap();
      this.activeModal = null;
    });
  }
}

function initializeModals(lenis = null, animations = null, splitText = null, group = null, defaultDuration = 1) {
  // Initialization: set all to hidden, but editable in Webflow
  group.style.display = 'flex';
  group.style.visibility = 'hidden';
  group.setAttribute('aa-modal-group-status', 'not-active');
  
  // Create state and controller
  const state = new ModalState(group, defaultDuration);
  const controller = new ModalController(group, state, lenis, defaultDuration);
  
  // Set all modals to inactive initially
  state.getAllModals().forEach(modal => {
    modal.style.visibility = 'hidden';
    modal.style.display = 'none';
    modal.setAttribute('aa-modal-status', 'not-active');
  });
  
  return {
    open: (modalName) => controller.openModal(modalName),
    close: () => controller.closeModal()
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
    modal: (group) => initializeModals(lenis, animations, splitText, group, defaultDuration)
  };
}

export { createModalAnimations }; 