import styles from "../scss/AlrdyAnimate.scss";
import { setupResizeHandler } from './utils/resizeHandler';
import { handleLazyLoadedImages } from './utils/lazyLoadHandler';
import { processChildren } from './utils/childrenHandler';
import { getElementSettings, applyElementStyles } from './utils/elementAttributes';

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

          // Double-check registration
          if (!gsap.plugins?.ScrollTrigger) {
            console.log('Registering ScrollTrigger plugin in AlrdyAnimate.js');
            gsap.registerPlugin(ScrollTrigger);
          }

          // Verify registration
          if (!gsap.plugins?.ScrollTrigger) {
            console.error('ScrollTrigger registration failed in AlrdyAnimate.js');
          } else {
            console.log('ScrollTrigger registration confirmed in AlrdyAnimate.js');
          }

          window.gsap = gsap;
          window.ScrollTrigger = ScrollTrigger;

          // Set up sticky nav
          const navElement = document.querySelector('[aa-nav="sticky"]');
          if (navElement) {
            const navEase = navElement.getAttribute('aa-easing');
            const navDuration = navElement.getAttribute('aa-duration');
            importedModules.animations.stickyNav(navElement, navEase ?? 'back.inOut', navDuration ?? 0.4);
          }

          setupAnimations(allAnimatedElements, settings, isMobile, importedModules.animations, importedModules.splitText);

          // Set up resize handler
          setupResizeHandler(importedModules.ScrollTrigger, allAnimatedElements, settings, isMobile, importedModules, setupAnimations);

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

// Setup animations for elements
function setupAnimations(elements, settings, isMobile, animations = null, splitText = null) {
  // First, process parent elements with aa-children attribute
  elements.forEach((element) => {
    if (element.hasAttribute("aa-children")) {
      // Use the new processChildren utility
      const children = processChildren(element, settings);
      setupAnimations(children, settings, isMobile, animations, splitText);
      return;
    }

    // Use the new elementAttributes utilities
    applyElementStyles(element, settings, isMobile);
    const elementSettings = getElementSettings(element, settings, isMobile);
    
    const anchorElement = elementSettings.anchorSelector ? 
      document.querySelector(elementSettings.anchorSelector) : 
      element;

    if (settings.useGSAP) {
      setupGSAPAnimation(
        element, 
        elementSettings.anchorSelector, 
        anchorElement, 
        elementSettings.viewportPercentage, 
        elementSettings.delay, 
        settings, 
        animations, 
        splitText, 
        isMobile
      );
    } else {
      setupIntersectionObserver(
        element, 
        elementSettings.anchorSelector, 
        anchorElement, 
        elementSettings.viewportPercentage, 
        settings
      );
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

const AlrdyAnimate = {
  init,
  getGSAP: () => gsap,
  getScrollTrigger: () => ScrollTrigger
};

// Export as a named export
export { AlrdyAnimate };

// Also attach to window for direct browser usage
if (typeof window !== 'undefined') {
  window.AlrdyAnimate = AlrdyAnimate;
}
