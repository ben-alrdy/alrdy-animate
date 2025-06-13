export function createNavAnimations(gsap) {
  return function initializeNav(element, type, ease = 'power2.out', duration = 0.6, distance = 1, scrolled = 100) {
    if (!element || !gsap) return;

    // Track class state to avoid unnecessary DOM operations
    let hasScrolledClass = false;

    // Function to ensure nav is visible at top
    const showNavAtTop = () => {
      gsap.to(element, { y: '0%', duration, ease, overwrite: true });
    };

    // Add function to handle scrolled class
    const updateScrolledClass = (scrollTop) => {
      if (scrollTop >= scrolled && !hasScrolledClass) {
        element.classList.add('is-scrolled');
        hasScrolledClass = true;  
      } else if (scrollTop < scrolled && hasScrolledClass) {
        element.classList.remove('is-scrolled');
        hasScrolledClass = false;
      }
    };

    // Check initial scroll position
    requestAnimationFrame(() => {
      const initialScrollTop = window.scrollY;
      if (type.includes('change')) {
        updateScrolledClass(initialScrollTop);
      }
      if (type.includes('hide') && initialScrollTop > 50) {
        gsap.set(element, { 
          y: `${-100 * distance}%` 
        });
      }
    });

    // Watch for scroll direction changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-scroll-direction') {
          const direction = document.body.getAttribute('data-scroll-direction');
          const scrollTop = window.scrollY;
          
          if (type.includes('hide')) {
            if (direction === 'down') {
              gsap.to(element, { 
                y: `${-100 * distance}%`, 
                duration: duration * 2, 
                ease, 
                overwrite: true 
              });
            } else {
              showNavAtTop();
            }
          }
          
          if (type.includes('change')) {
            updateScrolledClass(scrollTop);
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });
  };
} 