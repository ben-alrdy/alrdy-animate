export function createNavAnimations(gsap, Flip) {
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

  // Shared helper to create FLIP config
  const createFlipConfig = (duration, ease) => ({
    duration,
    ease,
    absolute: true,
    simple: true,
    overwrite: 'auto'
  });

  // Shared helper to get current nav item
  const getCurrentNavItem = () => document.querySelector("[aa-scroll-target].is-current");

  // Initialize current indicator functionality using GSAP Flip
  const initCurrentIndicator = (Flip) => {
    if (!Flip) return;

    const navElement = document.querySelector('[aa-nav]');
    if (!navElement) return;

    const indicator = navElement.querySelector('[aa-nav-current-indicator]');
    if (!indicator) return;

    const duration = parseFloat(indicator.getAttribute('aa-duration')) || 0.4;
    const ease = indicator.getAttribute('aa-ease') || 'power2.out';
    const navigationItems = document.querySelectorAll("[aa-scroll-target]");
    
    if (navigationItems.length === 0) return;

    // Initialize position to first current item
    requestAnimationFrame(() => {
      const currentItem = getCurrentNavItem();
      if (currentItem) {
        Flip.fit(indicator, currentItem, { duration: 0, absolute: true, simple: true });
        // Show indicator after short delay to ensure positioning is complete
        gsap.delayedCall(duration, () => {
          gsap.set(indicator, { opacity: 1 });
        });
      }
    });

    // Update indicator on class changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.classList.contains('is-current')) {
            Flip.fit(indicator, target, createFlipConfig(duration, ease));
            break; // Only one item can be current at a time
          }
        }
      }
    });

    navigationItems.forEach(item => {
      observer.observe(item, { attributes: true, attributeFilter: ['class'] });
    });
  };

  // Initialize hover indicator functionality using GSAP Flip
  const initHoverIndicator = (Flip) => {
    if (!Flip) return;

    // Disable on touch devices (no hover capability)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const navElement = document.querySelector('[aa-nav]');
    if (!navElement) return;

    const hoverIndicator = navElement.querySelector('[aa-nav-hover-indicator]');
    const currentIndicator = navElement.querySelector('[aa-nav-current-indicator]');
    if (!hoverIndicator) return;

    const duration = parseFloat(hoverIndicator.getAttribute('aa-duration')) || 0.4;
    const ease = hoverIndicator.getAttribute('aa-ease') || 'power2.out';
    const navigationItems = document.querySelectorAll("[aa-scroll-target]");
    
    if (navigationItems.length === 0) return;

    let isHovering = false;

    // Animate to target with shared config
    const animateTo = (target, animDuration = duration) => {
      if (target) Flip.fit(hoverIndicator, target, createFlipConfig(animDuration, ease));
    };

    // Return to appropriate position based on state
    const returnToHome = () => {
      const currentItem = getCurrentNavItem();
      if (currentItem) {
        // If there's an active nav item, animate to it
        animateTo(currentItem);
      } else if (currentIndicator) {
        // If no active item, match the current indicator position
        Flip.fit(hoverIndicator, currentIndicator, createFlipConfig(duration, ease));
      }
    };

    // Initialize position to current item
    requestAnimationFrame(() => {
      const currentItem = getCurrentNavItem();
      if (currentItem) {
        Flip.fit(hoverIndicator, currentItem, { duration: 0, absolute: true, simple: true });
        // Show indicator after short delay to ensure positioning is complete
        gsap.delayedCall(duration, () => {
          gsap.set(hoverIndicator, { opacity: 1 });
        });
      }
    });

    // Update hover indicator when current changes (only if not hovering)
    const observer = new MutationObserver(() => {
      if (!isHovering) {
        returnToHome();
      }
    });

    navigationItems.forEach(item => {
      observer.observe(item, { attributes: true, attributeFilter: ['class'] });
      
      item.addEventListener('mouseenter', () => {
        isHovering = true;
        animateTo(item);
      });
    });

    navElement.addEventListener('mouseleave', () => {
      isHovering = false;
      returnToHome();
    });
  };

  return {
    nav: initializeNav,
    initNavigationTracking,
    initNavSectionClasses,
    initCurrentIndicator,
    initHoverIndicator
  };
} 