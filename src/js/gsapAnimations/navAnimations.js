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
    
    // Early return if no navigation items found
    if (navigationItems.length === 0) return;

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

  // Initialize nav section classes functionality using GSAP ScrollTrigger
  const initNavSectionClasses = (ScrollTrigger) => {
    // Only proceed if ScrollTrigger is available
    if (!ScrollTrigger) {
      console.warn('GSAP ScrollTrigger not available for nav section classes');
      return;
    }

    // Get the nav element
    const navElement = document.querySelector('[aa-nav]');
    if (!navElement) return;

    // Get all sections with aa-nav-section attribute
    const navSections = document.querySelectorAll('[aa-nav-section]');
    
    // Early return if no nav sections found
    if (navSections.length === 0) return;

    // Store all section classes for cleanup
    const allSectionClasses = [];

    // Create ScrollTrigger for each section
    navSections.forEach(section => {
      const sectionClass = section.getAttribute('aa-nav-section');
      if (!sectionClass) return;

      // Store class for later cleanup
      allSectionClasses.push(sectionClass);

      // Get scroll positions with defaults
      const scrollStart = section.getAttribute('aa-scroll-start') || 'top 0%';
      const scrollEnd = section.getAttribute('aa-scroll-end') || 'bottom 0%';

      // Create ScrollTrigger for this section
      ScrollTrigger.create({
        trigger: section,
        start: scrollStart,
        end: scrollEnd,
        onEnter: () => {
          // Remove all section classes from nav
          allSectionClasses.forEach(cls => {
            navElement.classList.remove(cls);
          });
          // Add current section class
          navElement.classList.add(sectionClass);
        },
        onEnterBack: () => {
          // Remove all section classes from nav
          allSectionClasses.forEach(cls => {
            navElement.classList.remove(cls);
          });
          // Add current section class
          navElement.classList.add(sectionClass);
        },
        onLeave: () => {
          // Remove current section class
          navElement.classList.remove(sectionClass);
        },
        onLeaveBack: () => {
          // Remove current section class
          navElement.classList.remove(sectionClass);
        }
      });
    });
  };

  // Initialize nav animations
  const initializeNav = (ScrollTrigger) => {
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

    // Use ScrollTrigger for better performance
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const direction = self.direction;
        const scrollTop = window.scrollY;
        
        // Handle hide feature
        if (navType.includes('hide')) {
          if (direction === 1) { // Scrolling down
            gsap.to(navElement, { 
              y: `${-100 * navDistance}%`, 
              duration: navDuration * 2, 
              ease: navEase, 
              overwrite: true 
            });
          } else { // Scrolling up
            showNavAtTop(navElement, navDuration, navEase);
          }
        }
        
        // Handle change feature
        if (navType.includes('change')) {
          updateScrolledClass(navElement, scrollTop, navScrolled);
        }
      }
    });
  };

  return {
    nav: initializeNav,
    initNavigationTracking,
    initNavSectionClasses
  };
} 