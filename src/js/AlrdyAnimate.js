import styles from "../scss/AlrdyAnimate.scss";
import { setupResizeHandler } from './utils/resizeHandler';
import { handleLazyLoadedImages } from './utils/lazyLoadHandler';
import { processChildren } from './utils/childrenHandler';
import { getElementSettings, applyElementStyles } from './utils/elementAttributes';
import { processTemplates, getFinalSettings, clearProcessedTemplates } from './utils/templateHandler';
import { initializeScrollState, initializePlayStateObserver } from './utils/defaultFeatures';

// Define these variables in the module scope
let allAnimatedElements = null;
let isMobile = false;
let enableGSAP = false;
let initTimeoutId = null;

// Default options for the animation settings
const defaultOptions = {
  ease: "ease-in-out", // Default easing function for animations
  again: true, // True = removes 'in-view' class when element is out of view towards the bottom
  scrollStart: "top 80%", // Default scroll start position
  scrollEnd: "bottom 70%", // Default scroll end position
  duration: 1, // 1 second
  delay: 0, // 0 seconds
  distance: 1, // Distance factor for the animations
  hoverDuration: 0.3, // 0.3 seconds
  hoverDelay: 0, // 0 seconds
  hoverEase: "power3.out", // Default easing function for hover animations
  hoverDistance: 0.1, // Distance factor for the hover animations
  gsapFeatures: [],  
  includeGSAP: false, // Whether to include GSAP in the bundle or use Webflow's version
  smoothScroll: {
    enabled: true,
    options: {} // Defined in smoothScroll/setup.js
  },
  modals: false,
  lazyLoadHandler: false, // default to false for backward compatibility
  debug: false, // Set to true to see GSAP debug info
  templates: null, // Template configuration for class-based animations
  initTimeout: 3000 // 3 seconds timeout for initialization
};

async function init(options = {}) {
  const initOptions = { ...defaultOptions, ...options };
  let lenis = null;

  // Set initialization state
  window.alrdyInitialized = false;

  // Set timeout for initialization
  initTimeoutId = setTimeout(() => {
    if (!window.alrdyInitialized) {
      console.warn('AlrdyAnimate initialization taking longer than expected - showing elements temporarily');
      handleInitError(null, allAnimatedElements);
    }
  }, initOptions.initTimeout);

  try {
    // Initialize core features
    initializeScrollState();
    initializePlayStateObserver();

    // Process templates if specified
    const templates = processTemplates(initOptions);

    // First get all elements with animation attributes
    let elements = [...document.querySelectorAll("[aa-animate], [aa-children], [aa-hover]")];
    
    // If templates are enabled, add elements with matching classes
    if (templates) {
      const templateSelectors = Object.keys(templates).map(className => 
        `.${className}:not([aa-animate]):not([aa-load])`
      ).join(',');
      
      const templateElements = document.querySelectorAll(templateSelectors);
      elements = [...elements, ...templateElements];
    }
      
    allAnimatedElements = elements;
    isMobile = window.innerWidth < 768;
    enableGSAP = initOptions.gsapFeatures.length > 0;

    // Fallback for browsers that do not support IntersectionObserver
    if (!("IntersectionObserver" in window) && !enableGSAP) {
      handleInitError('No IntersectionObserver support found', allAnimatedElements);
      return; // Exit the script as the fallback is applied
    }

    // Set default values on body
    document.body.style.setProperty("--aa-default-duration", `${initOptions.duration}s`);
    document.body.style.setProperty("--aa-default-delay", `${initOptions.delay}s`);
    document.body.style.setProperty("--aa-default-distance", `${initOptions.distance}`);
    document.body.style.setProperty("--aa-default-hover-duration", `${initOptions.hoverDuration}s`);
    document.body.style.setProperty("--aa-default-hover-delay", `${initOptions.hoverDelay}s`);
    document.body.style.setProperty("--aa-default-hover-distance", `${initOptions.distance}`); // relevant for css hover animations; using the default distance of 1 instead of hoverDistance
    document.body.setAttribute("aa-ease", initOptions.ease);

    let gsapModulesPromise = null;
    let loadedModules = null;

    // Initialize GSAP features if enabled
    if (enableGSAP) {
      gsapModulesPromise = (async () => {
        try {
          // Load GSAP and its modules
          const { getGSAPModules, gsapBundles } = await import('./utils/moduleBundle');
          const { gsap, ScrollTrigger } = await getGSAPModules(initOptions.includeGSAP);

          const modules = { gsap, ScrollTrigger };
          const animations = {};

          // Register ScrollTrigger immediately
          gsap.registerPlugin(ScrollTrigger);
          window.gsap = gsap;
          window.ScrollTrigger = ScrollTrigger;

          try {
            // Load all features in parallel with individual error handling
            await Promise.all(
              initOptions.gsapFeatures.map(async (feature) => {
                try {
                  const moduleConfig = gsapBundles[feature];
                  if (!moduleConfig) return;

                  if (moduleConfig.plugins) {
                    const plugins = await moduleConfig.plugins(initOptions.includeGSAP);
                    plugins.forEach(plugin => {
                      try {
                        Object.entries(plugin).forEach(([key, value]) => {
                          if (value) {  // Only register if the plugin exists
                            gsap.registerPlugin(value);
                            window[key] = value;
                          } else {
                            console.warn(`Plugin ${key} not available from ${initOptions.includeGSAP ? 'bundle' : 'Webflow'}`);
                          }
                        });
                        Object.assign(modules, plugin);
                      } catch (pluginError) {
                        console.warn(`Failed to register plugin for feature ${feature}:`, pluginError);
                      }
                    });
                  }

                  if (moduleConfig.dependencies) {
                    const deps = await moduleConfig.dependencies();
                    Object.assign(modules, deps);
                    if (deps.splitText) {
                      window.splitText = deps.splitText;
                    }
                  }

                  if (moduleConfig.animations) {
                    const animationModule = await moduleConfig.animations();
                    let moduleAnimations = {};

                    switch (feature) {
                      case 'text':
                        moduleAnimations = animationModule.createTextAnimations(modules.gsap);
                        break;
                      case 'section':
                        moduleAnimations = animationModule.createSectionAnimations(modules.gsap, modules.ScrollTrigger);
                        break;
                      case 'appear':
                        moduleAnimations = animationModule.createAppearAnimations(modules.gsap, modules.ScrollTrigger);
                        break;
                      case 'marquee':
                        moduleAnimations = animationModule.createMarqueeAnimations(modules.gsap, modules.ScrollTrigger);
                        break;
                      case 'slider':
                        moduleAnimations = animationModule.createSliderAnimations(modules.gsap, modules.Draggable);
                        break;
                      case 'hover':
                        moduleAnimations = animationModule.createHoverAnimations(modules.gsap, modules.splitText);
                        break;
                      case 'nav':
                        moduleAnimations = animationModule.createNavAnimations(modules.gsap);
                        break;
                    }

                    Object.assign(animations, moduleAnimations);
                  }
                } catch (featureError) {
                  console.warn(`Failed to load feature ${feature}:`, featureError);
                }
              })
            );
          } catch (featuresError) {
            console.warn('Failed to load some GSAP features:', featuresError);
          }

          modules.animations = animations;

          // Initialize modal animations after all other animations are set up
          if (initOptions.gsapFeatures.includes('modal')) {
            try {
              const modalModule = await gsapBundles.modal.animations();
              
              const modalAnimations = modalModule.createModalAnimations(
                modules.gsap,
                lenis,
                modules.animations,
                modules.splitText
              );

              // Store the modal animation function (like all other gsap animations)
              modules.animations.modal = (group) => {
                if (modalAnimations?.modal && typeof modalAnimations.modal === 'function') {
                  return modalAnimations.modal(group);
                }
              };
            } catch (modalError) {
              console.warn('Failed to initialize modal animations:', modalError);
            }
          }

          return modules;
        } catch (error) {
          console.warn('Failed to load GSAP core:', error);
          return null;
        }
      })();
    }

    // Initialize Lenis if enabled (regardless of GSAP)
    if (initOptions.smoothScroll?.enabled) {
      try {
        const { coreBundles } = await import('./utils/moduleBundle');
        const smoothScrollModule = coreBundles.smoothScroll;
        
        const [{ default: Lenis }, { initializeSmoothScroll }] = await Promise.all([
          smoothScrollModule.plugins(),
          smoothScrollModule.setup()
        ]);

        lenis = initializeSmoothScroll(
          Lenis, 
          window.gsap || null,  // Use window.gsap if available, otherwise null
          window.ScrollTrigger || null,  // Use window.ScrollTrigger if available, otherwise null
          initOptions.smoothScroll.options
        );
        window.lenis = lenis;
      } catch (error) {
        console.warn('Failed to initialize smooth scroll:', error);
      }
    }

    // Initialize modals if enabled
    if (initOptions.modals) {
     
      try {
        const { coreBundles } = await import('./utils/moduleBundle');
        const { initializeModals } = await coreBundles.modals.setup();
        initializeModals(lenis); 
      } catch (error) {
        console.warn('Failed to initialize modals:', error);
      }
    }

    return new Promise((resolve) => {
      // Wait for window load to setup actual animations
      window.addEventListener('load', async () => {
        if (enableGSAP) {
          loadedModules = await gsapModulesPromise;

          if (loadedModules) {
            // Setup nav animations if feature is enabled
            if (initOptions.gsapFeatures.includes('nav')) {
              loadedModules.animations.nav();
            }

            // Setup modal animations if feature is enabled
            if (initOptions.gsapFeatures.includes('modal')) {
              const modalGroups = document.querySelectorAll('[aa-modal-group]');
              if (modalGroups.length > 0) {
                modalGroups.forEach(group => {
                  loadedModules.animations.modal(group);
                });
              }
            }

            // Setup animations
            setupAnimations(allAnimatedElements, initOptions, isMobile, loadedModules);
            setupResizeHandler(loadedModules, initOptions, isMobile, setupGSAPAnimations);

            // Only initialize lazy load handler if enabled
            if (initOptions.lazyLoadHandler) {
              handleLazyLoadedImages(loadedModules.ScrollTrigger);
            }
          } else {
            // Fallback if GSAP loading failed
            enableGSAP = false;
            allAnimatedElements.forEach((element) => {
              element.style.visibility = 'visible';
              element.style.opacity = 1;
            });
            setupAnimations(allAnimatedElements, initOptions, isMobile, { gsap: null, ScrollTrigger: null });
          }
        } else {
          setupAnimations(allAnimatedElements, initOptions, isMobile, { gsap: null, ScrollTrigger: null });
        }

        // Clear processed templates after setup
        clearProcessedTemplates();

        // Clear timeout and set initialization state
        clearTimeout(initTimeoutId);
        window.alrdyInitialized = true;
        document.dispatchEvent(new Event('alrdy-init-complete'));

        resolve({ 
          gsap: loadedModules?.gsap || null, 
          ScrollTrigger: loadedModules?.ScrollTrigger || null,
          lenis: lenis
        });
      });
    });
  } catch (error) {
    // Only handle error if initialization hasn't completed
    if (!window.alrdyInitialized) {
      handleInitError(error, allAnimatedElements);
      document.dispatchEvent(new Event('alrdy-init-failed'));
    }
    throw error;
  }
}

function setupAnimations(elements, initOptions, isMobile, modules) {
  elements.forEach((element) => {
    // Process children elements
    if (element.hasAttribute("aa-children")) {
      const children = processChildren(element);
      setupAnimations(children, initOptions, isMobile, modules);
      return;
    }

    // Get settings from attributes or templates
    const templateSettings = getFinalSettings(element, initOptions, isMobile);
    const settings = templateSettings || getElementSettings(element, initOptions, isMobile);
    
    // Skip if no settings found
    if (!settings) return;
    
    // Store settings on the element for resize handling
    element.settings = settings;

    // Apply styles (duration, delay, colors)
    applyElementStyles(element, settings, isMobile);

    // Setup hover animations 
    if (element.hasAttribute('aa-hover')) {
      // Check if device supports hover
      const hasHoverSupport = window.matchMedia('(hover: hover)').matches;
      if (hasHoverSupport && enableGSAP && initOptions.gsapFeatures.includes('hover')) {
        setupGSAPHoverAnimations(element, settings, modules);
      } 
    }

    // Setup regular animations
    if (element.hasAttribute('aa-animate') || templateSettings) {
      if (enableGSAP) {
        setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
      } else {
        element.style.visibility = 'visible';
        setupIntersectionObserver(element, settings, initOptions);
      }
    }
  });
}

function setupGSAPAnimations(element, elementSettings, initOptions, isMobile, modules) {
  const { animationType, split, scrub, duration, stagger, delay, ease, distance, anchorElement, anchorSelector, scrollStart, scrollEnd } = elementSettings;
  
  // 1. Variables setup
  const baseType = animationType.includes('-') ? animationType.split('-')[0] : animationType;
  const gsapAnimations = ['appear', 'reveal', 'counter', 'text', 'slider', 'background', 'parallax', 'marquee', 'clip', 'stack'];
  
  // 2. Determine if this animation type creates its own ScrollTriggers
  const ownScrollTriggerAnimations = ['clip', 'stack', 'slider', 'background', 'parallax', 'marquee'];
  const hasOwnScrollTrigger = ownScrollTriggerAnimations.includes(baseType);

  // Clear existing animations
  if (element.timeline) element.timeline.kill();
  if (element.splitInstance) element.splitInstance.revert();

  // 3. Create timeline and ScrollTrigger setup (only for animations that don't have their own ScrollTriggers)
  let tl = null;
  if (!hasOwnScrollTrigger) {
    tl = modules.gsap.timeline({
      paused: !scrub
    });
    element.timeline = tl;

    //Create Animation ScrollTrigger
    modules.ScrollTrigger.create({
      trigger: anchorElement,
      ...(scrub ? {
        start: scrollStart,
        end: scrollEnd,
        stagger,
        scrub: scrub ? 
          (parseFloat(scrub) || true)
        : false,
        invalidateOnRefresh: true
      } : {
        start: scrollStart
      }),
      animation: tl,
      onEnter: () => {
        element.classList.add("in-view");
        gsap.set(element, { visibility: 'visible' });
        if (!scrub) tl.play();
      },
      onRefresh: function() {
        // For scrub animations, check if element should be visible on page load
        if (scrub) {

          if (document.body.getAttribute('data-scroll-started') !== 'true') {
            return;
          }
          
          const elementRect = anchorElement.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          // Parse scrollStart to get trigger position for legacy compatibility
          const scrollStartMatch = scrollStart.match(/top\s+(\d+)%/);
          const triggerStart = scrollStartMatch ? viewportHeight * (parseFloat(scrollStartMatch[1]) / 100) : viewportHeight * 0.8;
          
          // If element is above the trigger start point, make it visible and set to end state
          if (elementRect.bottom < triggerStart) {
            element.classList.add("in-view");
            gsap.set(element, { visibility: 'visible' });
            
            if (baseType === 'text') {
              // We need to wait for the splitInstance to be available before setting the timeline to end state
              const waitForSplitInstance = () => {
                if (element.splitInstance) {
                  tl.progress(1); // Set timeline to end state
                } else {
                  requestAnimationFrame(waitForSplitInstance);  // Keep checking until splitInstance is available
                }
              };
              requestAnimationFrame(waitForSplitInstance);
            
            } else {
              const waitForTimeline = () => {
                if (tl.duration() > 0) {
                  tl.progress(1);
                  gsap.set(element, { autoAlpha: 1 });
                } else {
                  requestAnimationFrame(waitForTimeline);
                }
              };
              requestAnimationFrame(waitForTimeline);
            }
          }
        }
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
      }
    });
  }

  // 4. Return early if not a GSAP animation
  if (!gsapAnimations.includes(baseType)) {
    return;
  }

  // 5. Handle GSAP animations
  requestAnimationFrame(() => {
    switch(baseType) {
      case 'clip':
        modules.animations.clip(element);
        return;

      case 'stack':
        modules.animations.stack(element, scrub, distance);
        return;
        
      case 'slider':
        modules.animations.slider(element, animationType, duration, ease, delay);
        break;

      case 'background':
        modules.animations.backgroundColor(element, duration, ease, scrollStart, scrollEnd, initOptions.debug, scrub);
        break;

      case 'parallax':
        modules.animations.parallax(element, scrub, animationType);
        break;

      case 'marquee':
        modules.animations.marquee(element, duration, scrub, animationType);
        break;

      case 'appear':
        tl.add(modules.animations.appear(element, duration, ease, delay, distance, animationType));
        break;

      case 'reveal':
        tl.add(modules.animations.reveal(element, duration, ease, delay, animationType));
        break;

      case 'counter':
        tl.add(modules.animations.counter(element, duration, ease, delay, animationType));
        break;

      case 'text':
        const { splitInstance } = modules.splitText(
          element, 
          split,
          false,
          (self) => {
            // Strip suffixes to get baseType
            const baseTextAnim = animationType.replace(/-clip|-lines|-words|-chars$/, '');
            const animation = modules.animations.text[baseTextAnim];
            if (animation) {
              const timeline = animation(element, split, duration, stagger, delay, ease).onSplit(self);
              if (timeline) {
                tl.add(timeline); 
              }
              return timeline;
            }
            return null;
          },
          animationType
        );
        element.splitInstance = splitInstance;
        break;

      default:
        console.warn(`Unknown animation type: ${baseType}`);
        break;
    }
  });
}

function setupIntersectionObserver(element, elementSettings, initOptions) {
  const { anchorElement, anchorSelector, scrollStart } = elementSettings;
  
  // Parse scrollStart to get bottom margin for IntersectionObserver
  let bottomMargin = 20; // default fallback
  const scrollStartMatch = scrollStart.match(/top\s+(\d+)%/);
  if (scrollStartMatch) {
    bottomMargin = 100 - parseFloat(scrollStartMatch[1]);
  }
  
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

function setupGSAPHoverAnimations(element, elementSettings, modules) {
  const { hoverType } = elementSettings;
  
  // Split multiple hover types
  const hoverTypes = hoverType.split('&');
  
  // Process each hover type
  hoverTypes.forEach(type => {
    const [baseType, ...subtypes] = type.split('-');
    
    switch (baseType) {
      case 'text':
        modules.animations.initializeTextHover(element, {
          ...elementSettings,
          hoverType: type
        });
        break;
      case 'bg':
        modules.animations.initializeBackgroundHover(element, {
          ...elementSettings,
          hoverType: type
        }, subtypes[0]); // circle, curve, expand
        break;
      case 'icon':
        modules.animations.initializeIconHover(element, {
          ...elementSettings,
          hoverType: type
        });
        break;
    }
  });
}

function handleInitError(error, elements) {
  if (error) {
    console.error('Error initializing AlrdyAnimate:', error);
  }
  elements.forEach((element) => {
    element.classList.add('in-view');
    element.style.visibility = 'visible';
    element.style.opacity = 1;
  });
}

// Method for page-specific animations
function initPageAnimations(callback) {
  if (window.alrdyInitialized) {
    if (callback && typeof callback === 'function') {
      callback();
    }
  } else {
    document.addEventListener('alrdy-init-complete', () => {
      if (callback && typeof callback === 'function') {
        callback();
      }
    });
  }
}

const AlrdyAnimate = {
  init,
  initPageAnimations,
  gsap: window.gsap,
  ScrollTrigger: window.ScrollTrigger,
  Draggable: window.Draggable,
  splitText: window.splitText,
  lenis: window.lenis
};

export { AlrdyAnimate };

// Also attach to window for direct browser usage
if (typeof window !== 'undefined') {
  window.AlrdyAnimate = AlrdyAnimate;
}