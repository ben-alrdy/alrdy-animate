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

        // FLIP logic if both trigger and modal have aa-flip
        /* if (trigger.hasAttribute('aa-flip') && targetModal && targetModal.hasAttribute('aa-flip')) {
          // Collect all data-flip-id values in trigger
          const triggerFlipEls = trigger.querySelectorAll('[data-flip-id]');
          const modalFlipEls = targetModal.querySelectorAll('[data-flip-id]');
          // Build a map of flip-id to elements for both trigger and modal
          const flipIds = new Set();
          triggerFlipEls.forEach(el => flipIds.add(el.getAttribute('data-flip-id')));
          modalFlipEls.forEach(el => flipIds.add(el.getAttribute('data-flip-id')));
          // Collect all matching elements
          const triggerEls = Array.from(flipIds).map(id => trigger.querySelector(`[data-flip-id="${id}"]`)).filter(Boolean);
          const modalEls = Array.from(flipIds).map(id => targetModal.querySelector(`[data-flip-id="${id}"]`)).filter(Boolean);
          // Record FLIP state
          const state = window.Flip.getState([...triggerEls, ...modalEls]);
          // Show modal, hide trigger (but keep in DOM for FLIP)
          modalGroup.setAttribute('aa-modal-group-status', 'active');
          targetModal.setAttribute('aa-modal-status', 'active');
          
          disableScroll();
          activeModal = targetModal;
          document.addEventListener('keydown', handleTabKey);
          document.addEventListener('keydown', handleEscKey);
          // Animate FLIP
          window.Flip.from(state, {
            duration: 0.7,
            ease: 'power1.inOut',
            absolute: true
          });
          // Focus first focusable element
          const firstFocusable = targetModal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) firstFocusable.focus();
          // Restore trigger visibility on modal close
          const closeBtn = targetModal.querySelector('[aa-modal-close]');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              trigger.style.visibility = '';
            }, { once: true });
          }
        } else */ 
        
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