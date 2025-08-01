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

  // Initialize navigation tracking functionality using GSAP ScrollTrigger
  const initNavigationTracking = (ScrollTrigger) => {
    // Only proceed if ScrollTrigger is available
    if (!ScrollTrigger) {
      console.warn('GSAP ScrollTrigger not available for navigation tracking');
      return;
    }

    // Get all scroll target elements and their corresponding sections
    const navigationItems = document.querySelectorAll("[aa-scroll-target]");
    const sections = [];
    
    navigationItems.forEach(navItem => {
      const targetSelector = navItem.getAttribute("aa-scroll-target");
      const targetSection = document.querySelector(targetSelector);
      
      if (targetSection) {
        sections.push({
          navItem: navItem,
          section: targetSection,
          id: targetSelector
        });
      }
    });

    if (sections.length === 0) return;

    // Create ScrollTrigger instances for each section
    sections.forEach(({ navItem, section, id }) => {
      ScrollTrigger.create({
        trigger: section,
        start: '0% 50%',
        end: '100% 50%',
        onEnter: () => {
          // Remove 'is-current' class from all navigation items
          navigationItems.forEach(item => {
            item.classList.remove('is-current');
          });
          // Add 'is-current' class to the current navigation item
          navItem.classList.add('is-current');
        },
        onEnterBack: () => {
          // Remove 'is-current' class from all navigation items
          navigationItems.forEach(item => {
            item.classList.remove('is-current');
          });
          // Add 'is-current' class to the current navigation item
          navItem.classList.add('is-current');
        },
        onLeave: () => {
          // Remove 'is-current' class when section leaves viewport
          navItem.classList.remove('is-current');
        },
        onLeaveBack: () => {
          // Remove 'is-current' class when section leaves viewport (scrolling up)
          navItem.classList.remove('is-current');
        }
      });
    });
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
    nav: initializeNav,
    initNavigationTracking
  };
} 