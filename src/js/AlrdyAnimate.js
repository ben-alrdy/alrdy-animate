import styles from "../scss/AlrdyAnimate.scss";
import debounce from 'lodash.debounce';

// Define these variables in the module scope
let gsap = null;
let ScrollTrigger = null;
let allAnimatedElements = null;
let settings = null;
let isMobile = false;

// Default options for the animation settings
const defaultOptions = {
  easing: "ease", // Default easing function for animations
  again: true, // True = removes 'in-view' class when element is out of view towards the bottom
  viewportPercentage: 0.8, // Default percentage of the viewport height to trigger the animation
  useGSAP: false, // Use GSAP for animations
  duration: 1, // 1 second
  delay: 0, // 0 seconds
  debug: false // Set to true to see GSAP debug info
};

// Initialize the animation script with the given options
async function init(options = {}) {
  settings = { ...defaultOptions, ...options };
  allAnimatedElements = document.querySelectorAll(
    "[aa-animate], [aa-children]"
  );
  isMobile = window.innerWidth < 768;

  // Fallback for browsers that do not support IntersectionObserver
  if (!("IntersectionObserver" in window) && !settings.useGSAP) {
    allAnimatedElements.forEach((element) => {
      element.classList.add("in-view");
    });
    return; // Exit the script as the fallback is applied
  }

  // Set easing on the body element
  document.body.setAttribute("aa-easing", settings.easing);

  return new Promise((resolve) => { // Return a promise to handle asynchronous loading
    window.addEventListener('load', async () => {
      if (settings.useGSAP) {
        try {
          const importedModules = await import(
            /* webpackChunkName: "gsap-animations" */ 
            './gsapBundle'
          );

          // Store instances and make them globally available
          gsap = importedModules.gsap;
          ScrollTrigger = importedModules.ScrollTrigger;
          window.gsap = gsap;
          window.ScrollTrigger = ScrollTrigger;

          // Set up sticky nav
          const navElement = document.querySelector('[aa-nav="sticky"]');
          if (navElement) {
            const navEase = navElement.getAttribute('aa-easing');
            const navDuration = navElement.getAttribute('aa-duration');
            importedModules.stickyNav(importedModules.gsap, importedModules.ScrollTrigger, navElement, navEase, navDuration);
          }

          setupAnimations(allAnimatedElements, settings, isMobile, importedModules.animations, importedModules.splitText);

          // Set up resize handler
          setupResizeHandler(importedModules);

          // Handle lazy-loaded images
          handleLazyLoadedImages();

          resolve({ gsap, ScrollTrigger });
        } catch (error) {
          console.error('Failed to load GSAP:', error);
          // Make all elements visible that were hidden for GSAP animations
          allAnimatedElements.forEach((element) => {
            element.style.visibility = 'visible';
          });
          // Fallback to non-GSAP animations if loading fails
          setupAnimations(allAnimatedElements, settings, isMobile);
          resolve({ gsap: null, ScrollTrigger: null });  // Resolve with null if GSAP fails to load
        }
      } else {
        setupAnimations(allAnimatedElements, settings, isMobile);
        resolve({ gsap: null, ScrollTrigger: null });  // Resolve with null if not using GSAP
      }
    });
  });
}

// function to handle resize logic
function setupResizeHandler(importedModules) {
  let prevWidth = window.innerWidth;

  const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    
    if (currentWidth !== prevWidth) {
      isMobile = currentWidth < 768;
      // Refresh all ScrollTriggers
      ScrollTrigger.refresh();
      // Re-setup animations
      setupAnimations(allAnimatedElements, settings, isMobile, importedModules.animations, importedModules.splitText);
      
      prevWidth = currentWidth;
    }
  }, 250);

  window.addEventListener('resize', debouncedResize);

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== prevWidth) {
        debouncedResize();
      }
    }, 100);
  });
}

// Setup animations for elements
function setupAnimations(elements, settings, isMobile, animations = null, splitText = null) {
  // First, process parent elements with aa-children attribute
  elements.forEach((element) => {
    if (element.hasAttribute("aa-children")) {
      const children = Array.from(element.children);
      const parentDelay = element.hasAttribute("aa-delay") ? parseFloat(element.getAttribute("aa-delay")) : settings.delay;
      const stagger = element.hasAttribute("aa-stagger") ? parseFloat(element.getAttribute("aa-stagger")) : 0;
      const animationType = element.getAttribute("aa-children"); // Get the animation type
      
      // Copy relevant attributes from parent to children
      children.forEach((child, index) => {

        console.log('Setting animation type:', animationType);
        // Skip if child already has animation attributes
        if (child.hasAttribute("aa-animate")) {
          return;
        }
        

        // Set the animation type from aa-children as aa-animate
        if (animationType && animationType !== "true") {
          
          child.setAttribute("aa-animate", animationType);
        }

        // Copy all aa-* attributes except aa-children and aa-stagger
        Array.from(element.attributes)
          .filter(attr => attr.name.startsWith('aa-') && 
                         attr.name !== 'aa-children' && 
                         attr.name !== 'aa-stagger' &&
                         attr.name !== 'aa-delay')
          .forEach(attr => {
            child.setAttribute(attr.name, attr.value);
          });

        // Calculate and set staggered delay
        const childDelay = parentDelay + (index * stagger);
        child.setAttribute("aa-delay", childDelay.toString());
      });

      // Make parent visible after processing children
      element.style.opacity = '1';
      
      // Process the children as animated elements
      setupAnimations(children, settings, isMobile, animations, splitText);
      return; // Skip processing the parent element
    }

    // Original setupAnimations logic for non-parent elements
    const duration = element.hasAttribute("aa-duration") ? parseFloat(element.getAttribute("aa-duration")) : settings.duration;
    const delay = element.hasAttribute("aa-delay") ? parseFloat(element.getAttribute("aa-delay")) : settings.delay;
    const delayMobile = element.hasAttribute("aa-delay-mobile") ? parseFloat(element.getAttribute("aa-delay-mobile")) : null;
    const colorInitial = element.getAttribute("aa-color-initial") || settings.colorInitial;
    const colorFinal = element.getAttribute("aa-color-final") || settings.colorFinal;
    const viewportPercentage = element.hasAttribute("aa-viewport") ? parseFloat(element.getAttribute("aa-viewport")) : settings.viewportPercentage;
    const anchorSelector = element.getAttribute("aa-anchor");
    const anchorElement = anchorSelector ? document.querySelector(anchorSelector) : element; //The 'anchorElement' will be observed, while the 'element' gets the in-view class; if there is no anchorSelector, the element itself is the anchor

    // Set animation duration and delay based on attributes or init options
    if (duration) {
      element.style.setProperty("--animation-duration", `${duration}s`);
    }

    // Set animation delay based on attributes, init options, and mobile settings
    if (isMobile && delayMobile !== null) {
      element.style.setProperty("--animation-delay", `${delayMobile}s`);
    } else if (delay) {
      element.style.setProperty("--animation-delay", `${delay}s`);
    }

    // Set background colors based on attributes
    if (colorInitial) {
      element.style.setProperty("--background-color-initial", colorInitial);
    }
    if (colorFinal) {
      element.style.setProperty("--background-color-final", colorFinal);
    }

    if (settings.useGSAP) {
      setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, delay, settings, animations, splitText, isMobile);
    } else {
      setupIntersectionObserver(element, anchorSelector, anchorElement, viewportPercentage, settings);
    }
  });
}

function setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, delay, settings, animations, splitText, isMobile) {
  const animationType = element.getAttribute('aa-animate');
  const splitTypeAttr = element.getAttribute('aa-split');
  const scroll = element.getAttribute('aa-scroll');
  const duration = element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute("aa-duration")) : undefined;
  const stagger = element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : undefined;
  const ease = element.hasAttribute('aa-easing') ? element.getAttribute('aa-easing') : undefined;

  // Clear existing animation if any in case of re-run (e.g. when changing the viewport width)
  if (element.timeline) {
    element.timeline.kill();
  }
  if (element.splitInstance) {
    element.splitInstance.revert();
  }

  requestAnimationFrame(() => { // Wait for the next animation frame to ensure the element is visible

    let tl = gsap.timeline({
      paused: true,
      scrollTrigger: {
        trigger: anchorElement,
        start: `top ${(viewportPercentage) * 100}%`,
        onEnter: () => {
          element.classList.add("in-view");
          tl.play();
        },
        markers: settings.debug
      }
    });

    element.timeline = tl; // Store the timeline on the element for future reference

    if (splitTypeAttr) {
      const { splitResult, splitType } = splitText(element, splitTypeAttr);
      element.splitInstance = splitResult; // Store the split instance on the element

      // Choose the animation based on the attribute
      switch (animationType) {
        case 'text-slide-up':
          tl.add(animations.textSlideUp(element, splitResult, splitType, duration ?? 0.5, stagger ?? 0.1, delay, ease ?? 'back.out', isMobile, scroll));
          break;
        case 'text-slide-down':
          tl.add(animations.textSlideDown(element, splitResult, splitType, duration ?? 0.5, stagger ?? 0.1, delay, ease ?? 'back.out', isMobile, scroll));
          break;
        case 'text-tilt-up':
          tl.add(animations.textTiltUp(element, splitResult, splitType, duration ?? 0.5, stagger ?? 0.1, delay, ease ?? 'back.out', isMobile, scroll));
          break;
        case 'text-tilt-down':
          tl.add(animations.textTiltDown(element, splitResult, splitType, duration ?? 0.5, stagger ?? 0.1, delay, ease ?? 'back.out', isMobile, scroll));
          break;
        case 'text-rotate-soft':
          tl.add(animations.textRotateSoft(element, splitResult, splitType, duration ?? 1.2, stagger ?? 0.3, delay, ease ?? 'circ.out', isMobile, scroll));
          break;
        case 'text-fade':
          tl.add(animations.textFade(element, splitResult, splitType, duration ?? 1, stagger ?? 0.08, delay, ease ?? 'power2.inOut', isMobile, scroll));
          break;
        case 'text-appear':
          tl.add(animations.textAppear(element, splitResult, splitType, duration ?? 1, stagger ?? 0.08, delay, ease ?? 'power2.inOut', isMobile, scroll));
          break;
      }
    }

    // Second ScrollTrigger for reset functionality
    ScrollTrigger.create({
      trigger: anchorElement,
      start: 'top 100%',
      onLeaveBack: () => {
        if (settings.again || anchorSelector) {
          element.classList.remove("in-view");
          tl.progress(0).pause();
        }
      },
    });
  });
}

function setupIntersectionObserver(element, anchorSelector, anchorElement, viewportPercentage, settings) {
  const bottomMargin = (1 - viewportPercentage) * 100;
  const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;

  // Observer to add 'in-view' class
  const addObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          element.classList.add("in-view");
        }
      });
    },
    {
      threshold: [0, 1], // Trigger callback when any part or the whole element is visible
      rootMargin: rootMarginValue,
    }
  );

  // Observer to remove 'in-view' class if settings.again is true or triggered by anchor
  const removeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const rect = entry.target.getBoundingClientRect();
        if (
          !entry.isIntersecting &&
          rect.top >= window.innerHeight &&
          (settings.again || anchorSelector)
        ) {
          element.classList.remove("in-view");
        }
      });
    },
    {
      threshold: 0, // Trigger callback when the element is not visible at all
      rootMargin: "0px", // Ensure this observer uses the full viewport
    }
  );

  addObserver.observe(anchorElement);
  removeObserver.observe(anchorElement);
}

function handleLazyLoadedImages() {
  let needsRefresh = false;

  const debouncedRefresh = debounce(() => {
    if (ScrollTrigger && needsRefresh) {
      ScrollTrigger.refresh();
      needsRefresh = false; // Reset after refresh
    }
  }, 200);

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');

  lazyImages.forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', () => {
        needsRefresh = true;
      }, { once: true });
    }
  });

  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (needsRefresh) {
      debouncedRefresh(); // Refresh when scrolling ends if needed
    }
  });
}

const AlrdyAnimate = {
  init,
  getGSAP: () => gsap,
  getScrollTrigger: () => ScrollTrigger,
  handleLazyLoadedImages
};

// Export as a named export
export { AlrdyAnimate };

// Also attach to window for direct browser usage
if (typeof window !== 'undefined') {
  window.AlrdyAnimate = AlrdyAnimate;
}
