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
export function initializeFormSubmitButton() {
  // Progressive enhancement: only run if fetch() exists
  if (!("fetch" in window)) return;

  document.querySelectorAll('[aa-submit-button]').forEach(button => {
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

    // Cache DOM queries and configuration
    const loadElement = button.querySelector('[aa-submit-load]');
    const loadIndicator = button.querySelector('[aa-submit-load-indicator]');
    const loadingDelay = button.hasAttribute('aa-submit-loading-delay') ? parseFloat(button.getAttribute('aa-submit-loading-delay')) : 0.3;
    const successDelay = button.hasAttribute('aa-submit-success-delay') ? parseFloat(button.getAttribute('aa-submit-success-delay')) : 1.2;
    const errorDelay = button.hasAttribute('aa-submit-error-delay') ? parseFloat(button.getAttribute('aa-submit-error-delay')) : 1.2;
    const useWebflowSuccess = button.getAttribute('aa-submit-webflow-success') !== 'false';
    
    // State classes (customize in your CSS)
    const loadingClass = 'is-loading';
    const successClass = 'is-success';
    const errorClass = 'is-error';
    
    // Webflow form elements - cache these lookups
    const formWrapper = form.closest('.w-form');
    const successMessage = formWrapper?.querySelector('.w-form-done');
    const errorMessage = formWrapper?.querySelector('.w-form-fail');


    function beginLoading() {
      // Handle disabled state differently for anchors vs buttons
      if (isAnchor) {
        button.style.pointerEvents = 'none';
        button.setAttribute('aria-disabled', 'true');
      } else {
        button.disabled = true;
      }
      
      button.classList.remove(successClass, errorClass);
      button.classList.add(loadingClass);
      button.setAttribute('aria-busy', 'true');

      // Show optional loading elements
      if (loadElement) loadElement.hidden = false;
      if (loadIndicator) loadIndicator.hidden = false;

      // Hide Webflow messages if they exist
      if (successMessage) successMessage.style.display = 'none';
      if (errorMessage) errorMessage.style.display = 'none';
    }

    function endLoading() {
      button.classList.remove(loadingClass);
      button.removeAttribute('aria-busy');
      if (loadElement) loadElement.hidden = true;
      if (loadIndicator) loadIndicator.hidden = true;
    }

    function handleSuccess() {
      button.classList.add(successClass);
      
      // Show Webflow success message and hide form only if Webflow success handling is enabled
      if (useWebflowSuccess && successMessage) {
        successMessage.style.display = 'block';
        form.style.display = 'none';
      }

      setTimeout(() => resetButton(), successDelay);
    }

    function handleError() {
      button.classList.add(errorClass);
      
      // Show Webflow error message if it exists
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }

      setTimeout(() => resetButton(), errorDelay);
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

    function submitForm() {
      const action = form.getAttribute('action') || window.location.href;
      const method = (form.getAttribute('method') || 'POST').toUpperCase();

      // Prepare fetch options
      const fetchOptions = {
        method,
        headers: { 'Accept': 'application/json' }
      };

      // Handle GET vs POST differently
      let url = action;
      if (method === 'GET') {
        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        // Convert FormData to URLSearchParams
        for (let [key, value] of formData.entries()) {
          params.append(key, value);
        }
        
        // Append params to URL
        const separator = action.includes('?') ? '&' : '?';
        url = `${action}${separator}${params.toString()}`;
      } else {
        fetchOptions.body = new FormData(form);
      }
      
      // Single fetch handler for both GET and POST
      fetch(url, fetchOptions)
        .then(handleResponse)
        .then(handleSuccessResponse)
        .catch(handleFetchError);
    }

    function handleResponse(response) {
      setTimeout(() => endLoading(), loadingDelay * 1000);

      if (!response.ok) {
        return response
          .json()
          .catch(() => ({ success: false }))
          .then((data) => {
            throw { networkError: true, data, statusText: response.statusText };
          });
      }
      return response.json().catch(() => ({ success: true }));
    }

    function handleSuccessResponse(data) {
      const ok = (typeof data?.success === 'boolean') ? data.success : true;
      setTimeout(() => (ok ? handleSuccess() : handleError()), 0);
    }

    function handleFetchError(err) {
      console.error('[AlrdyAnimate] Form submit error:', err);
      setTimeout(() => handleError(), 0);
    }

    function handleClick(event) {
      // Prevent default behavior
      event.preventDefault();
      
      // Check if form is valid
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
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