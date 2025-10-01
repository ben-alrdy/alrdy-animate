// Core initialization functions for AlrdyAnimate
export function initializeScrollState() {
  let lastScrollTop = 0;
  let lastScrollDirection = null;
  let lastScrollStarted = null;
  const threshold = 5;
  const thresholdTop = 50;
  let ticking = false;

  // Check initial scroll position
  requestAnimationFrame(() => {
    if (!document.body.hasAttribute('data-scroll-direction')) {
      document.body.setAttribute('data-scroll-direction', 'down');
      lastScrollDirection = 'down';
    } else {
      lastScrollDirection = document.body.getAttribute('data-scroll-direction');
    }
    
    const currentScrollTop = window.scrollY;
    const scrollStarted = currentScrollTop > thresholdTop ? 'true' : 'false';
    document.body.setAttribute('data-scroll-started', scrollStarted);
    lastScrollStarted = scrollStarted;
  });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScrollTop = window.scrollY;
        const delta = Math.abs(currentScrollTop - lastScrollTop);
        
        // Only process if we've scrolled more than the threshold
        if (delta >= threshold) {
          const direction = currentScrollTop > lastScrollTop ? 'down' : 'up';
          const hasScrolled = currentScrollTop > thresholdTop;
          const scrollStarted = hasScrolled ? 'true' : 'false';
          
          // Only update attributes if they've changed
          if (direction !== lastScrollDirection) {
            document.body.setAttribute('data-scroll-direction', direction);
            lastScrollDirection = direction;
          }
          
          if (scrollStarted !== lastScrollStarted) {
            document.body.setAttribute('data-scroll-started', scrollStarted);
            lastScrollStarted = scrollStarted;
          }
          
          lastScrollTop = currentScrollTop;
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  }, { passive: true });
}

// Play state observer
export function initializePlayStateObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const element = entry.target;
      // Get all children and filter those that have animations
      const children = element.children;
      
      Array.from(children).forEach(child => {
        const animations = child.getAnimations();
        if (animations.length > 0) {
          animations.forEach(animation => {
            if (entry.isIntersecting) {
              animation.play();
            } else {
              animation.pause();
            }
          });
        }
      });
    });
  });

  // Observe all containers with the attribute
  document.querySelectorAll('[aa-toggle-playstate]').forEach(element => {
    observer.observe(element);
  });
}

// Custom form submit button handler for Webflow forms
/**
 * Form Submit Button
 * 
 * Enhances form buttons with loading, success, and error states.
 * 
 * Behavior:
 * - If form has NO action attribute: Uses native Webflow submission (only adds loading state to button)
 * - If form has action attribute: Custom fetch submission with full state management
 * 
 * Attributes:
 * - aa-submit-button: Add to button/link to enable enhancement
 * - aa-submit-loading-duration: Loading animation duration in seconds (default: 0.3)
 * - aa-submit-success-duration: Success state duration in seconds (default: 1.2)
 * - aa-submit-error-duration: Error state duration in seconds (default: 1.2)
 * - aa-submit-logic: "default" or "custom" (controls form/message visibility)
 * - aa-submit-debug: Enable debug logging
 */
export function initializeFormSubmitButton() {
  // Progressive enhancement: only run if fetch() exists
  if (!("fetch" in window)) return;

  const submitButtons = document.querySelectorAll('[aa-submit-button]');
  
  submitButtons.forEach((button, index) => {
    const form = button.closest('form');
    
    if (!form) {
      console.warn('[AlrdyAnimate] Submit button is not inside a <form>.', button);
      return;
    }

    // Detect element type and set appropriate attributes
    const tagName = button.tagName.toLowerCase();
    const isAnchor = tagName === 'a';
    const isButton = tagName === 'button';

    // Set proper attributes based on element type
    if (isAnchor) {
      button.removeAttribute('href');
      button.setAttribute('role', 'button');
      if (!button.hasAttribute('tabindex')) {
        button.setAttribute('tabindex', '0');
      }
    } else if (isButton) {
      if (!button.hasAttribute('type')) {
        button.setAttribute('type', 'button');
      }
    } else {
      console.warn('[AlrdyAnimate] Unsupported element type for form submit:', tagName);
      return;
    }

    // Cache configuration
    const loadingDuration = button.hasAttribute('aa-submit-loading-duration') ? parseFloat(button.getAttribute('aa-submit-loading-duration')) : 0.3;
    const successDuration = button.hasAttribute('aa-submit-success-duration') ? parseFloat(button.getAttribute('aa-submit-success-duration')) : 1.2;
    const errorDuration = button.hasAttribute('aa-submit-error-duration') ? parseFloat(button.getAttribute('aa-submit-error-duration')) : 1.2;
    const submitLogic = button.getAttribute('aa-submit-logic') || 'default';
    const debugMode = button.hasAttribute('aa-submit-debug');
    
    if (debugMode) {
      console.log('[AlrdyAnimate] Button configuration:', {
        loadingDuration,
        successDuration,
        errorDuration,
        submitLogic
      });
    }
    
    // State classes (customize in your CSS)
    const loadingClass = 'is-loading';
    const successClass = 'is-success';
    const errorClass = 'is-error';
    
    // Webflow form elements - cache these lookups
    const formWrapper = form.closest('.w-form');
    const successMessage = formWrapper?.querySelector('.w-form-done');
    const errorMessage = formWrapper?.querySelector('.w-form-fail');
    
    if (debugMode) {
      console.log('[AlrdyAnimate] Webflow elements found:', {
        formWrapper: !!formWrapper,
        successMessage: !!successMessage,
        errorMessage: !!errorMessage
      });
    }


    function beginLoading() {
      // Reset all states when starting a new submission
      resetAllStates();
      
      // Handle disabled state differently for anchors vs buttons
      if (isAnchor) {
        button.style.pointerEvents = 'none';
        button.setAttribute('aria-disabled', 'true');
      } else {
        button.disabled = true;
      }
      
      button.classList.add(loadingClass);
      button.setAttribute('aria-busy', 'true');

      // Apply loading state to form wrapper
      if (formWrapper) {
        formWrapper.classList.add(loadingClass);
      }
    }

    function endLoading() {
      button.classList.remove(loadingClass);
      button.removeAttribute('aria-busy');
      
      // Remove loading state from form wrapper
      if (formWrapper) {
        formWrapper.classList.remove(loadingClass);
      }
    }

    function handleSuccess() {
      button.classList.add(successClass);
      
      if (submitLogic === 'default') {
        // Default behavior: hide form, show success message
        form.style.display = 'none';
        successMessage?.style.setProperty('display', 'block');
      } else {
        // Custom logic: apply classes to all elements
        formWrapper?.classList.remove(loadingClass, errorClass);
        formWrapper?.classList.add(successClass);
        successMessage?.classList.add(successClass);
      }

      setTimeout(() => resetButton(), successDuration * 1000);
    }

    function handleError() {
      button.classList.add(errorClass);
      
      if (submitLogic === 'default') {
        // Default behavior: show error message
        errorMessage?.style.setProperty('display', 'block');
      } else {
        // Custom logic: apply classes to all elements
        formWrapper?.classList.remove(loadingClass, successClass);
        formWrapper?.classList.add(errorClass);
        errorMessage?.classList.add(errorClass);
      }

      setTimeout(() => resetButton(), errorDuration * 1000);
    }

    function resetButton() {
      button.classList.remove(successClass, errorClass);
      
      // Re-enable button
      if (isAnchor) {
        button.style.pointerEvents = 'auto';
        button.removeAttribute('aria-disabled');
      } else {
        button.disabled = false;
      }
    }

    function resetAllStates() {
      if (submitLogic === 'default') {
        // Default behavior: show form, hide messages
        form.style.display = 'block';
        successMessage?.style.setProperty('display', 'none');
        errorMessage?.style.setProperty('display', 'none');
      } else {
        // Custom logic: reset classes on all elements
        formWrapper?.classList.remove(loadingClass, successClass, errorClass);
        successMessage?.classList.remove(successClass);
        errorMessage?.classList.remove(errorClass);
      }
      
      // Reset button
      resetButton();
    }

    function submitForm() {
      const action = form.getAttribute('action');
      const method = (form.getAttribute('method') || 'POST').toUpperCase();

      if (debugMode) {
        console.log('[AlrdyAnimate] Form submission:', { action, method });
      }

      // Prepare FormData
      const formData = new FormData(form);
      
      // Prepare fetch options
      const fetchOptions = {
        method,
        headers: { 'Accept': 'application/json' }
      };

      // Handle GET vs POST differently
      let url = action;
      if (method === 'GET') {
        const params = new URLSearchParams();
        
        // Convert FormData to URLSearchParams
        for (let [key, value] of formData.entries()) {
          params.append(key, value);
        }
        
        // Append params to URL
        const separator = action.includes('?') ? '&' : '?';
        url = `${action}${separator}${params.toString()}`;
      } else {
        // POST: send FormData in body
        fetchOptions.body = formData;
      }
      
      // Track when request completes and when delay completes
      let requestCompleted = false;
      let delayCompleted = false;
      let requestResult = null;
      
      const checkAndApplyResult = () => {
        if (requestCompleted && delayCompleted) {
          endLoading();
          if (requestResult) {
            handleSuccess();
          } else {
            handleError();
          }
        }
      };
      
      // Handle request completion
      fetch(url, fetchOptions)
        .then(handleResponse)
        .then(data => {
          requestCompleted = true;
          requestResult = data;
          checkAndApplyResult();
        })
        .catch(err => {
          requestCompleted = true;
          requestResult = null;
          checkAndApplyResult();
        });
      
      // Handle delay completion
      setTimeout(() => {
        delayCompleted = true;
        checkAndApplyResult();
      }, loadingDuration * 1000);
    }

    function handleResponse(response) {
      if (debugMode) {
        console.log('[AlrdyAnimate] Form response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type') || 'unknown'
        });
      }

      if (!response.ok) {
        return response
          .json()
          .catch(() => ({ success: false }))
          .then((data) => {
            if (debugMode) {
              console.log('[AlrdyAnimate] Error response:', data);
            }
            throw { networkError: true, data, statusText: response.statusText };
          });
      }
      
      // Try to parse JSON response
      return response.json().catch(() => {
        if (debugMode) {
          console.log('[AlrdyAnimate] Non-JSON response, treating as success');
        }
        return { success: true };
      });
    }

    function handleClick(event) {
      // Check if form is valid
      if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        return;
      }
      
      const action = form.getAttribute('action');
      
      // If no action URL, use native Webflow submission
      if (!action || action.trim() === '') {
        if (debugMode) {
          console.log('[AlrdyAnimate] No form action - delegating to Webflow native submission');
        }
        
        // Only add loading class to button (Webflow handles the rest)
        button.classList.add(loadingClass);
        if (isAnchor) {
          button.style.pointerEvents = 'none';
          button.setAttribute('aria-disabled', 'true');
        } else {
          button.disabled = true;
        }
        
        // Find or create a native submit button for Webflow to intercept
        let nativeSubmitter = form.querySelector('input[type="submit"]');
        if (!nativeSubmitter) {
          nativeSubmitter = document.createElement('input');
          nativeSubmitter.type = 'submit';
          nativeSubmitter.style.display = 'none';
          form.appendChild(nativeSubmitter);
        }
        
        // Trigger native submission (let event bubble to Webflow's handler)
        // Don't preventDefault - let Webflow handle it
        nativeSubmitter.click();
        return;
      }
      
      // Custom submission with full state management
      event.preventDefault();
      beginLoading();
      submitForm();
    }

    function handleKeyDown(event) {
      if (isAnchor && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        handleClick(event);
      }
    }

    // Add event listeners based on element type
    if (isAnchor) {
      button.addEventListener('click', handleClick);
      button.addEventListener('keydown', handleKeyDown);
    } else if (isButton) {
      button.addEventListener('click', handleClick);
      
      // Also listen for form submit events if this is the submitter
      form.addEventListener('submit', (event) => {
        if (event.submitter === button) {
          handleClick(event);
        }
      });
    }
  });
}