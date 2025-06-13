export function createNavAnimations(gsap) {
  // Track class state to avoid unnecessary DOM operations
  let hasScrolledClass = false;

  // Function to ensure nav is visible at top
  const showNavAtTop = (element, duration, ease) => {
    gsap.to(element, { y: '0%', duration, ease, overwrite: true });
  };

  // Add function to handle scrolled class
  const updateScrolledClass = (element, scrollTop, scrolled) => {
    if (scrollTop >= scrolled && !hasScrolledClass) {
      element.classList.add('is-scrolled');
      hasScrolledClass = true;  
    } else if (scrollTop < scrolled && hasScrolledClass) {
      element.classList.remove('is-scrolled');
      hasScrolledClass = false;
    }
  };

  // Initialize nav animations
  const initializeNav = () => {
    const navElement = document.querySelector('[aa-nav]');
    if (!navElement) return;

    // Get attributes with defaults
    const navType = navElement.getAttribute('aa-nav') || 'hide';
    const navEase = navElement.getAttribute('aa-ease') || 'power2.out';
    const navDuration = parseFloat(navElement.getAttribute('aa-duration')) || 0.6;
    const navDistance = parseFloat(navElement.getAttribute('aa-distance')) || 1;
    
    // Extract scroll value from navType if present, default to 100
    const navScrolled = navType.includes('-') ? 
      parseInt(navType.split('-').pop()) || 100 : 
      100;

    // Check initial scroll position
    requestAnimationFrame(() => {
      const initialScrollTop = window.scrollY;
      if (navType.includes('change')) {
        updateScrolledClass(navElement, initialScrollTop, navScrolled);
      }
      if (navType.includes('hide') && initialScrollTop > 50) {
        gsap.set(navElement, { 
          y: `${-100 * navDistance}%` 
        });
      }
    });

    // Watch for scroll direction changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-scroll-direction') {
          const direction = document.body.getAttribute('data-scroll-direction');
          const scrollTop = window.scrollY;
          
          if (navType.includes('hide')) {
            if (direction === 'down') {
              gsap.to(navElement, { 
                y: `${-100 * navDistance}%`, 
                duration: navDuration * 2, 
                ease: navEase, 
                overwrite: true 
              });
            } else {
              showNavAtTop(navElement, navDuration, navEase);
            }
          }
          
          if (navType.includes('change')) {
            updateScrolledClass(navElement, scrollTop, navScrolled);
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });
  };

  return {
    nav: initializeNav
  };
} 