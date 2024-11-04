import styles from "../scss/AlrdyAnimate.scss";
import debounce from 'lodash.debounce';
import { setupResizeHandler } from './utils/resizeHandler';
import { handleLazyLoadedImages } from './utils/lazyLoadHandler';
import { processChildren } from './utils/childrenHandler';
import { getElementSettings, applyElementStyles } from './utils/elementAttributes';

// Define these variables in the module scope
let gsap = null;
let ScrollTrigger = null;
let allAnimatedElements = null;
let isMobile = false;

// Default options for the animation settings
const defaultOptions = {
  easing: "ease", // Default easing function for animations
  again: true, // True = removes 'in-view' class when element is out of view towards the bottom
  viewportPercentage: 0.8, // Default percentage of the viewport height to trigger the animation
  useGSAP: false, // Use GSAP for animations
  GSAPAnimations: ['scroll', 'draggable', 'text'], // Array of GSAP animations to use
  duration: 1, // 1 second
  delay: 0, // 0 seconds
  debug: false // Set to true to see GSAP debug info
};

// Initialize the animation script with the given options
async function init(options = {}) {
  const initOptions = { ...defaultOptions, ...options };
  allAnimatedElements = document.querySelectorAll(
    "[aa-animate], [aa-children]"
  );
  isMobile = window.innerWidth < 768;

  // Fallback for browsers that do not support IntersectionObserver
  if (!("IntersectionObserver" in window) && !initOptions.useGSAP) {
    allAnimatedElements.forEach((element) => {
      element.classList.add("in-view");
    });
    return; // Exit the script as the fallback is applied
  }

  // Set default values on body
  document.body.style.setProperty("--aa-default-duration", `${initOptions.duration}s`);
  document.body.style.setProperty("--aa-default-delay", `${initOptions.delay}s`);
  document.body.setAttribute("aa-easing", initOptions.easing);

  return new Promise((resolve) => { // Return a promise to handle asynchronous loading
    window.addEventListener('load', async () => {
      if (initOptions.useGSAP) {
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
            importedModules.animations.stickyNav(navElement, navEase ?? 'back.inOut', navDuration ?? 0.4);
          }

          setupAnimations(allAnimatedElements, initOptions, isMobile, importedModules.animations, importedModules.splitText);

          // Set up resize handler
          setupResizeHandler(importedModules.ScrollTrigger, allAnimatedElements, initOptions, isMobile, importedModules, setupAnimations);

          // Handle lazy-loaded images
          handleLazyLoadedImages(ScrollTrigger);

          resolve({ gsap, ScrollTrigger });
        } catch (error) {
          console.error('Failed to load GSAP:', error);
          // Make all elements visible that were hidden for GSAP animations
          allAnimatedElements.forEach((element) => {
            element.style.visibility = 'visible';
          });
          // Fallback to non-GSAP animations if loading fails
          setupAnimations(allAnimatedElements, initOptions, isMobile);
          resolve({ gsap: null, ScrollTrigger: null });  // Resolve with null if GSAP fails to load
        }
      } else {
        setupAnimations(allAnimatedElements, initOptions, isMobile);
        resolve({ gsap: null, ScrollTrigger: null });  // Resolve with null if not using GSAP
      }
    });
  });
}

// Setup animations for elements
function setupAnimations(elements, initOptions, isMobile, animations = null, splitText = null) {
  elements.forEach((element) => {
    if (element.hasAttribute("aa-children")) {
      const children = processChildren(element);
      setupAnimations(children, initOptions, isMobile, animations, splitText);
      return; // Skip processing the parent element
    }

    // Get all element settings from the aa-attributes
    const elementSettings = getElementSettings(element, initOptions);
    
    // Apply styles (duration, delay, colors)
    applyElementStyles(element, elementSettings, isMobile);

    if (initOptions.useGSAP) {
      setupGSAPAnimations(element, elementSettings, initOptions, animations, splitText, isMobile);
    } else {
      setupIntersectionObserver(element, elementSettings, initOptions);
    }
  });
}

function setupGSAPAnimations(element, elementSettings, initOptions, animations, splitText, isMobile) {
  const { animationType, splitType: splitTypeAttr, scroll, duration, stagger, delay, ease, anchorElement, anchorSelector, viewportPercentage } = elementSettings;

  // Clear existing animation if any in case of re-run (e.g. when changing the viewport width)
  if (element.timeline) element.timeline.kill();
  if (element.splitInstance) element.splitInstance.revert();

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
        markers: initOptions.debug
      }
    });

    element.timeline = tl; // Store the timeline on the element for future reference

    if (splitTypeAttr) {
      const { splitResult, splitType } = splitText(element, splitTypeAttr);
      element.splitInstance = splitResult; // Store the split instance on the element

      // Define the animation configurations
      const animationConfigs = {
        'text-slide-up': { fn: animations.textSlideUp,        defaults: { duration: 0.5, stagger: 0.1, ease: 'back.out' } },
        'text-slide-down': { fn: animations.textSlideDown,    defaults: { duration: 0.5, stagger: 0.1, ease: 'back.out' } },
        'text-tilt-up': { fn: animations.textTiltUp,          defaults: { duration: 0.5, stagger: 0.1, ease: 'back.out' } },
        'text-tilt-down': { fn: animations.textTiltDown,      defaults: { duration: 0.5, stagger: 0.1, ease: 'back.out' } },
        'text-rotate-soft': { fn: animations.textRotateSoft,  defaults: { duration: 1.2, stagger: 0.3, ease: 'circ.out' } },
        'text-fade': { fn: animations.textFade,               defaults: { duration: 1, stagger: 0.08, ease: 'power2.inOut' } },
        'text-appear': { fn: animations.textAppear,           defaults: { duration: 1, stagger: 0.08, ease: 'power2.inOut' } }
      };

      // Get the animation configuration defined in the element settings
      const config = animationConfigs[animationType];

      if (config) {
        // Add the animation to the timeline
        tl.add(config.fn(
          element,
          splitResult,
          splitType,
          duration ?? config.defaults.duration,
          stagger ?? config.defaults.stagger,
          delay,
          ease ?? config.defaults.ease,
          isMobile,
          scroll
        ));
      }
    }

    // Second ScrollTrigger for reset functionality
    ScrollTrigger.create({
      trigger: anchorElement,
      start: 'top 100%',
      onLeaveBack: () => {
        if (initOptions.again || anchorSelector) {
          element.classList.remove("in-view");
          tl.progress(0).pause();
        }
      },
    });
  });
}

function setupIntersectionObserver(element, elementSettings, initOptions) {
  const { anchorElement, anchorSelector, viewportPercentage } = elementSettings;
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

  // Observer to remove 'in-view' class if initOptions.again is true or triggered by anchor
  const removeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const rect = entry.target.getBoundingClientRect();
        if (
          !entry.isIntersecting &&
          rect.top >= window.innerHeight &&
          (initOptions.again || anchorSelector)
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
