function initializeModals(lenis = null) {
    const modalGroup = document.querySelector('[aa-modal-group]');
    const modalTriggers = document.querySelectorAll('[aa-modal-target]');
    const closeButtons = document.querySelectorAll('[aa-modal-close]');
    
    let activeModal = null;
  
    // Utility function to disable body scroll
    function disableScroll() {
      if (lenis) {
        lenis.stop();
      } else {
        document.body.style.overflow = 'hidden';
      }
    }
  
    // Utility function to enable body scroll
    function enableScroll() {
      if (lenis) {
        lenis.start();
      } else {
        document.body.style.overflow = '';
      }
    }
  
    // Function to close all modals
    function closeAllModals() {
      if (!modalGroup) return;
      modalGroup.setAttribute('aa-modal-group-status', 'not-active');
      modalGroup.querySelectorAll('[aa-modal-name]').forEach(modal => {
        modal.setAttribute('aa-modal-status', 'not-active');
      });
      enableScroll();
      activeModal = null;
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscKey);
    }
  
    // Function to handle tab key for focus trapping
    function handleTabKey(e) {
      if (!activeModal) return;
      
      const focusable = activeModal.querySelectorAll(
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
  
    // Function to handle escape key
    function handleEscKey(e) {
      if (e.key === 'Escape') closeAllModals();
    }
  
    // Open modal handler
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const targetName = trigger.getAttribute('aa-modal-target');
        if (!modalGroup) return;
        closeAllModals();
        const targetModal = modalGroup.querySelector(`[aa-modal-name="${targetName}"]`);
        if (targetModal) {
          modalGroup.setAttribute('aa-modal-group-status', 'active');
          targetModal.setAttribute('aa-modal-status', 'active');
          disableScroll();
          activeModal = targetModal;
          document.addEventListener('keydown', handleTabKey);
          document.addEventListener('keydown', handleEscKey);
          // Focus first focusable element
          const firstFocusable = targetModal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) firstFocusable.focus();
        }
      });
    });
  
    // Close button handler
    closeButtons.forEach(button => {
      button.addEventListener('click', closeAllModals);
    });
  
    // Close on background click
    if (modalGroup) {
      modalGroup.addEventListener('click', (e) => {
        if (e.target === modalGroup) closeAllModals();
      });
    }
  
    return {
      closeAll: closeAllModals
    };
  }
  
  export { initializeModals };