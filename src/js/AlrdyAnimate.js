import styles from "../scss/AlrdyAnimate.scss";
import { setupResizeHandler } from './utils/resizeHandler';
import { handleLazyLoadedImages } from './utils/lazyLoadHandler';
import { processChildren } from './utils/childrenHandler';
import { getElementSettings, applyElementStyles } from './utils/elementAttributes';

// Define these variables in the module scope
let allAnimatedElements = null;
let isMobile = false;
let enableGSAP = false;

// Default options for the animation settings
const defaultOptions = {
  ease: "ease-in-out", // Default easing function for animations
  again: true, // True = removes 'in-view' class when element is out of view towards the bottom
  viewportPercentage: 0.8, // Default percentage of the viewport height to trigger the animation
  duration: 1, // 1 second
  delay: 0, // 0 seconds
  distance: 1, // Distance factor for the animations
  gsapFeatures: [],  // Available: ['text', 'slider', 'hover', 'scroll']
  debug: false // Set to true to see GSAP debug info
};

// Map aa-animate attributes to GSAP animation names
const TEXT_ANIMATION_MAP = {
  'text-slide-up': 'slideUp',
  'text-slide-down': 'slideDown',
  'text-tilt-up': 'tiltUp',
  'text-tilt-down': 'tiltDown',
  'text-rotate-soft': 'rotateSoft',
  'text-fade-soft': 'fadeSoft',
  'text-fade': 'fade',
  'text-fade-up': 'fadeUp'
};

// Initialize the animation script with the given options
async function init(options = {}) {
  const initOptions = { ...defaultOptions, ...options };

  // Early initialization
  allAnimatedElements = document.querySelectorAll("[aa-animate], [aa-children]");
  isMobile = window.innerWidth < 768;
  enableGSAP = initOptions.gsapFeatures.length > 0;

  // Fallback for browsers that do not support IntersectionObserver
  if (!("IntersectionObserver" in window) && !enableGSAP) {
    allAnimatedElements.forEach((element) => {
      element.classList.add("in-view");
    });
    return; // Exit the script as the fallback is applied
  }

  // Set default values on body
  document.body.style.setProperty("--aa-default-duration", `${initOptions.duration}s`);
  document.body.style.setProperty("--aa-default-delay", `${initOptions.delay}s`);
  document.body.style.setProperty("--aa-distance", `${initOptions.distance}`);
  document.body.setAttribute("aa-ease", initOptions.ease);

  // Start loading GSAP modules early if needed
  let gsapModulesPromise = null;
  let loadedModules = null;

  if (enableGSAP) {
    gsapModulesPromise = (async () => {
      try {
        // Load GSAP and its modules
        const { gsap, ScrollTrigger, gsapBundles } = await import(
          /* webpackChunkName: "gsap-core" */
          './gsapBundle'
        );

        const modules = { gsap, ScrollTrigger };
        const animations = {};

        // Register ScrollTrigger immediately
        gsap.registerPlugin(ScrollTrigger);
        window.gsap = gsap;
        window.ScrollTrigger = ScrollTrigger;

        // Load all features in parallel
        await Promise.all(
          initOptions.gsapFeatures.map(async (feature) => {
            const moduleConfig = gsapBundles[feature];
            if (!moduleConfig) return;

            if (moduleConfig.plugins) {
              const plugins = await moduleConfig.plugins();
              plugins.forEach(plugin => {
                Object.entries(plugin).forEach(([key, value]) => {
                  gsap.registerPlugin(value);
                  if (key === 'Draggable' || value.toString().includes('Draggable')) {
                    window.Draggable = value;
                    globalThis.Draggable = value;
                  }
                });
                Object.assign(modules, plugin);
              });
            }

            if (moduleConfig.dependencies) {
              const deps = await moduleConfig.dependencies();
              Object.assign(modules, deps);
            }

            if (moduleConfig.animations) {
              const animationModule = await moduleConfig.animations();
              let moduleAnimations = {};

              switch (feature) {
                case 'text':
                  moduleAnimations = animationModule.createTextAnimations(modules.gsap);
                  break;
                case 'scroll':
                  moduleAnimations = animationModule.createScrollAnimations(modules.gsap, modules.ScrollTrigger);
                  break;
                case 'slider':
                  moduleAnimations = animationModule.createSliderAnimations(modules.gsap, modules.Draggable);
                  break;
                case 'hover':
                  moduleAnimations = animationModule.createHoverAnimations(modules.gsap, modules.splitText);
                  moduleAnimations.initializeHoverAnimations();
                  break;
              }

              Object.assign(animations, moduleAnimations);
            }
          })
        );

        modules.animations = animations;
        return modules;
      } catch (error) {
        console.error('Failed to load GSAP:', error);
        return null;
      }
    })();
  }

  return new Promise((resolve) => {
    // Wait for window load to setup actual animations
    window.addEventListener('load', async () => {
      if (enableGSAP) {
        loadedModules = await gsapModulesPromise;

        if (loadedModules) {
          // Setup nav animations
          const navElement = document.querySelector('[aa-nav]');
          if (navElement) {
            const navType = navElement.getAttribute('aa-nav');
            const navEase = navElement.getAttribute('aa-ease');
            const navDuration = navElement.getAttribute('aa-duration');
            const navDistance = navElement.getAttribute('aa-distance');
            const navScrolled = navElement.hasAttribute('aa-scroll') ? parseInt(navElement.getAttribute('aa-scroll')) : 100;
            loadedModules.animations.nav?.(navElement, navType, navEase ?? 'back.inOut', navDuration ?? 0.4, navDistance ?? 1, navScrolled);
          }

          // Now setup the actual animations
          setupAnimations(allAnimatedElements, initOptions, isMobile, loadedModules);
          setupResizeHandler(loadedModules, initOptions, isMobile, setupGSAPAnimations);
          handleLazyLoadedImages(loadedModules.ScrollTrigger);

          resolve({ gsap: loadedModules.gsap, ScrollTrigger: loadedModules.ScrollTrigger });
        } else {
          // Fallback if GSAP loading failed
          enableGSAP = false;
          allAnimatedElements.forEach((element) => {
            element.style.visibility = 'visible';
          });
          setupAnimations(allAnimatedElements, initOptions, isMobile, { gsap: null, ScrollTrigger: null });
          resolve({ gsap: null, ScrollTrigger: null });
        }
      } else {
        setupAnimations(allAnimatedElements, initOptions, isMobile, { gsap: null, ScrollTrigger: null });
        resolve({ gsap: null, ScrollTrigger: null });
      }
    });
  });
}

// Setup animations for elements
function setupAnimations(elements, initOptions, isMobile, modules) {
  elements.forEach((element) => {
    if (element.hasAttribute("aa-children")) {
      const children = processChildren(element);
      setupAnimations(children, initOptions, isMobile, modules);
      return; // Skip processing the parent element
    }

    // Get all element settings from the aa-attributes
    element.settings = getElementSettings(element, initOptions);

    // Apply styles (duration, delay, colors)
    applyElementStyles(element, element.settings, isMobile);

    if (enableGSAP) {
      setupGSAPAnimations(element, element.settings, initOptions, isMobile, modules);
    } else {
      element.style.visibility = 'visible';
      setupIntersectionObserver(element, element.settings, initOptions);
    }
  });
}

function setupGSAPAnimations(element, elementSettings, initOptions, isMobile, modules) {
  const { animationType, splitType: splitTypeAttr, scroll, duration, stagger, delay, ease, distance, anchorElement, anchorSelector, viewportPercentage } = elementSettings;
  
  // 1. Variables setup
  const baseType = animationType.includes('-') ? animationType.split('-')[0] : animationType;
  const gsapAnimations = ['appear', 'reveal', 'counter', 'text', 'slider', 'background', 'parallax'];

  // Clear existing animations
  if (element.timeline) element.timeline.kill();
  if (element.splitInstance) element.splitInstance.revert();

  // 2. Create timeline and ScrollTrigger setup
  let tl = modules.gsap.timeline({
    paused: !scroll
  });
  element.timeline = tl;

  //Create Animation ScrollTrigger
  modules.ScrollTrigger.create({
    trigger: anchorElement,
    ...(scroll ? {
      start: isMobile ? "top 40%" : `top ${(viewportPercentage) * 100}%`,
      end: isMobile ? "top 20%" : "top 40%",
      scrub: scroll.includes('smoother') ? 4 :
          scroll.includes('smooth') ? 2 :
          scroll.includes('snap') ? { snap: 0.2 } :
          true
    } : {
      start: `top ${(viewportPercentage) * 100}%`
    }),
    animation: tl,
    onEnter: () => {
      element.classList.add("in-view");
      if (!scroll) tl.play();
      gsap.set(element, { visibility: 'visible' });
    },
    markers: initOptions.debug
  });

  //Reset Animation ScrollTrigger
  modules.ScrollTrigger.create({
    trigger: anchorElement,
    start: 'top 100%',
    onLeaveBack: () => {
      if (initOptions.again || anchorSelector) {
        element.classList.remove("in-view");
        tl.progress(0).pause();
      }
    },
  });

  // 3. Return early if not a GSAP animation
  if (!gsapAnimations.includes(baseType)) {
    return;
  }

  // 4. Handle GSAP animations
  requestAnimationFrame(() => {
    switch(baseType) {
      case 'slider':
        modules.animations.slider(element, animationType, duration, ease, delay);
        break;

      case 'background':
        modules.animations.backgroundColor(element, duration, ease, viewportPercentage, initOptions.debug);
        break;

      case 'parallax':
        modules.animations.parallax(element, scroll);
        break;

      case 'appear':
        tl.add(modules.animations.appear(element, duration, ease, delay, distance));
        break;

      case 'reveal':
        tl.add(modules.animations.reveal(element, duration, ease, delay));
        break;

      case 'counter':
        tl.add(modules.animations.counter(element, duration, ease, delay));
        break;

      case 'text':
        const { splitResult, splitType } = modules.splitText(element, splitTypeAttr);
        element.splitInstance = splitResult;

        const animationName = TEXT_ANIMATION_MAP[animationType];
        if (animationName) {
          tl.add(modules.animations[animationName](element, splitResult, splitType, duration, stagger, delay, ease));
        }
        break;

      default:
        console.warn(`Unknown animation type: ${baseType}`);
        break;
    }
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
  getGSAP: () => window.gsap,
  getScrollTrigger: () => window.ScrollTrigger,
  getDraggable: () => window.Draggable
};

// Export as a named export
export { AlrdyAnimate };

// Also attach to window for direct browser usage
if (typeof window !== 'undefined') {
  window.AlrdyAnimate = AlrdyAnimate;
}

