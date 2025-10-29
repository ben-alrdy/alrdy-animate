import styles from "../scss/AlrdyAnimate.scss";
import { setupResizeHandler } from './utils/resizeHandler';
import { handleLazyLoadedImages } from './utils/lazyLoadHandler';
import { processChildren } from './utils/childrenHandler';
import { getElementSettings, applyElementStyles } from './utils/elementAttributes';
import { processTemplates, getFinalSettings, clearProcessedTemplates } from './utils/templateHandler';
import { initializeScrollState, initializePlayStateObserver, initializeFormSubmitButton } from './utils/defaultFeatures';
import { initAnimationEventTrigger } from './utils/animationEventTrigger';

// Define these variables in the module scope
let allAnimatedElements = null;
let isMobile = false;
let enableGSAP = false;
let initTimeoutId = null;
let isReducedMotion = false;

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
  lazyLoadHandler: false, // default to false for backward compatibility
  debug: false, // Set to true to see GSAP debug info
  templates: null, // Template configuration for class-based animations
  initTimeout: 3, // 3 seconds timeout for initialization
  reducedMotionDuration: 0.5, // Duration for reduced motion animations
  reducedMotionEase: "ease", // Easing for reduced motion animations
  loadGracePeriod: 0.35 // Grace period in seconds for hybrid aa-load + aa-animate elements (should be slightly shorter than --load-base-delay)
};

// Function to apply reduced motion by replacing animation attributes
function applyReducedMotionAttributes(duration, ease) {
  // Find all elements with aa-animate or aa-children attributes
  const animatedElements = document.querySelectorAll('[aa-animate], [aa-children], [aa-hover]');
  
  animatedElements.forEach((element) => {
    // Skip accordion-related elements
    if (element.hasAttribute('aa-accordion-content') || element.hasAttribute('aa-accordion')) {
      return; // Skip this element
    }
    
    const currentAnimate = element.getAttribute('aa-animate');
    
    // Skip complex GSAP animations that should be preserved
    if (currentAnimate && ['background', 'clip', 'stack'].includes(currentAnimate)) {
      return; // Skip this element
    }

    if (element.hasAttribute('aa-load') && element.hasAttribute('aa-animate')) {
      element.removeAttribute('aa-animate');
    }
    
    // Replace aa-animate with fade
    if (element.hasAttribute('aa-animate')) {
      element.setAttribute('aa-animate', 'fade');
    }
    
    // Replace aa-children with fade
    if (element.hasAttribute('aa-children')) {
      element.setAttribute('aa-children', 'fade');
    }

    if (element.hasAttribute('aa-hover')) {
      element.setAttribute('aa-hover', 'none');
    }
    
    // Set reduced motion duration and easing from options
    element.setAttribute('aa-duration', String(duration));
    element.setAttribute('aa-ease', ease);
  });
}

async function init(options = {}) {
  const initOptions = { ...defaultOptions, ...options };
  let lenis = null;

  // Check for reduced motion preference
  isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // If reduced motion is detected, replace animation attributes and disable templates
  if (isReducedMotion) {
    console.log('AlrdyAnimate: Reduced motion detected, replacing animations with fade-only');
    applyReducedMotionAttributes(initOptions.reducedMotionDuration, initOptions.reducedMotionEase);
    // Disable template system for reduced motion
    initOptions.templates = null;
  }

  // Set initialization state
  window.alrdyInitialized = false;

  // Set grace period timer - fires exactly when CSS animations would start
  // This ensures grace period attribute is set on time, not when JS finishes loading
  setTimeout(() => {
    if (!document.body.hasAttribute('aa-js-ready')) {
      // JS hasn't finished loading yet, grace period has expired
      document.body.setAttribute('aa-load-grace-expired', 'true');
      console.warn(`AlrdyAnimate: Loading grace period expired (${initOptions.loadGracePeriod}s) - hybrid loading elements will use CSS animations`);
    }
  }, initOptions.loadGracePeriod * 1000);

  // Set timeout for initialization
  initTimeoutId = setTimeout(() => {
    if (!window.alrdyInitialized) {
      console.warn('AlrdyAnimate initialization taking longer than expected - showing elements temporarily');
      handleInitError(null, allAnimatedElements);
    }
  }, initOptions.initTimeout * 1000);

  try {
    // Initialize core features
    initializeScrollState();
    initializePlayStateObserver();
    initializeFormSubmitButton();
    
    // Initialize animation event trigger with defaults
    initAnimationEventTrigger({
      duration: initOptions.duration,
      delay: initOptions.delay
    });

    // Process templates if specified
    const templates = processTemplates(initOptions);

    // First get all elements with animation attributes
    let elements = [...document.querySelectorAll("[aa-animate], [aa-children], [aa-hover], [aa-slider], [aa-accordion], [aa-marquee]")];
    
    // If templates are enabled, add elements with matching classes
    if (templates) {
      const templateSelectors = Object.keys(templates).map(className => 
        `.${className}:not([aa-animate]):not([aa-load]):not([aa-slider]):not([aa-accordion]):not([aa-marquee])`
      ).join(',');
      
      const templateElements = document.querySelectorAll(templateSelectors);
      elements = [...elements, ...templateElements];
    }
    
    // Store element types on each element to avoid repeated attribute lookups
    elements.forEach(element => {
      element._aaAttributeType = {
        isAnimate: element.hasAttribute('aa-animate'),
        isChildren: element.hasAttribute('aa-children'),
        isHover: element.hasAttribute('aa-hover'),
        isSlider: element.hasAttribute('aa-slider'),
        isAccordion: element.hasAttribute('aa-accordion'),
        isMarquee: element.hasAttribute('aa-marquee')
      };
    });
      
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
                      case 'accordion':
                        moduleAnimations = animationModule.createAccordionAnimations(modules.gsap, initOptions.duration);
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

          // Initialize Lenis if enabled (now that GSAP is available)
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
                modules.gsap,  // Use the GSAP instance from modules
                modules.ScrollTrigger,  // Use the ScrollTrigger instance from modules
                initOptions.smoothScroll.options
              );
              window.lenis = lenis;
            } catch (error) {
              console.warn('Failed to initialize smooth scroll:', error);
            }
          }

          // Initialize modal animations after all other animations are set up
          if (initOptions.gsapFeatures.includes('modal')) {
            try {
              const modalModule = await gsapBundles.modal.animations();
              
              const modalAnimations = modalModule.createModalAnimations(
                modules.gsap,
                lenis,
                initOptions.duration
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



    return new Promise((resolve) => {
      // Wait for window load to setup actual animations
      window.addEventListener('load', async () => {
        if (enableGSAP) {
          loadedModules = await gsapModulesPromise;

          if (loadedModules) {
            

            // Setup nav animations if feature is enabled
            if (initOptions.gsapFeatures.includes('nav')) {
              loadedModules.animations.nav(loadedModules.ScrollTrigger);
              loadedModules.animations.initNavigationTracking(loadedModules.ScrollTrigger);
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

            // Setup animations (accordions are now initialized inline during this traversal to maintain DOM order)
            setupAnimations(allAnimatedElements, initOptions, isMobile, loadedModules);
            setupResizeHandler(loadedModules, initOptions, isMobile, setupGSAPAnimations);

            // Refresh ScrollTrigger after setup animations
            if (loadedModules.ScrollTrigger) {
              loadedModules.ScrollTrigger.refresh(true);
            }

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

        // Mark body as JS-ready and log status
        document.body.setAttribute('aa-js-ready', 'true');

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

function batchProcessTextElements(textElements, initOptions, isMobile, modules) {
  const BATCH_SIZE = 10; // Process 10 text elements per frame
  let currentIndex = 0;
  
  function processBatch() {
    const batch = textElements.slice(currentIndex, currentIndex + BATCH_SIZE);
    
    batch.forEach(({ element, settings, aaAttributeType }) => {
      // Apply styles (duration, delay, colors)
      applyElementStyles(element, settings, isMobile);
      
      // Process children if needed
      if (aaAttributeType.isChildren) {
        const children = processChildren(element);
        setupAnimations(children, initOptions, isMobile, modules);
      }
      
      // Setup the text animation (includes SplitText creation)
      if (enableGSAP) {
        setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
      } else {
        element.style.visibility = 'visible';
        setupIntersectionObserver(element, settings, initOptions);
      }
    });
    
    currentIndex += BATCH_SIZE;
    
    // Schedule next batch if more elements remain
    if (currentIndex < textElements.length) {
      requestAnimationFrame(processBatch);
    }
  }
  
  // Start processing
  if (textElements.length > 0) {
    requestAnimationFrame(processBatch);
  }
}

function setupAnimations(elements, initOptions, isMobile, modules) {
  const textElements = [];
  const nonTextElements = [];
  
  // First pass: categorize elements into text and non-text
  elements.forEach((element) => {
    // Get cached types (or check directly for dynamically added elements)
    const aaAttributeType = element._aaAttributeType || {
      isAnimate: element.hasAttribute('aa-animate'),
      isChildren: element.hasAttribute('aa-children'),
      isHover: element.hasAttribute('aa-hover'),
      isSlider: element.hasAttribute('aa-slider'),
      isAccordion: element.hasAttribute('aa-accordion'),
      isMarquee: element.hasAttribute('aa-marquee')
    };
    
    // Process children elements
    if (aaAttributeType.isChildren) {
      const children = processChildren(element);
      setupAnimations(children, initOptions, isMobile, modules);
      // Don't return early if this is also an interactive component
      if (!aaAttributeType.isSlider && !aaAttributeType.isAccordion && !aaAttributeType.isMarquee) {
        return;
      }
    }

    // Get settings from attributes or templates
    const templateSettings = getFinalSettings(element, initOptions, isMobile);
    const settings = templateSettings || getElementSettings(element, initOptions, isMobile, initOptions.loadGracePeriod, aaAttributeType);
    
    // Skip if no settings found
    if (!settings) return;
    
    // Store settings on the element for resize handling
    element.settings = settings;
    
    // Check if this is a text animation
    const baseType = settings.animationType?.includes('-') 
      ? settings.animationType.split('-')[0] 
      : settings.animationType;
    const isTextAnimation = baseType === 'text' && (aaAttributeType.isAnimate || templateSettings);
    
    if (isTextAnimation) {
      // Add to text elements for batched processing
      textElements.push({ element, settings, aaAttributeType });
    } else {
      // Process non-text elements immediately
      nonTextElements.push({ element, settings, aaAttributeType });
    }
  });
  
  // Process non-text elements immediately
  nonTextElements.forEach(({ element, settings, aaAttributeType }) => {
    // Apply styles (duration, delay, colors)
    applyElementStyles(element, settings, isMobile);

    // Setup hover animations 
    if (aaAttributeType.isHover) {
      // Check if device supports hover
      const hasHoverSupport = window.matchMedia('(hover: hover)').matches;
      if (hasHoverSupport && enableGSAP && initOptions.gsapFeatures.includes('hover')) {
        setupGSAPHoverAnimations(element, settings, modules);
      } 
    }

    // Setup interactive components (sliders, accordions, marquees)
    if (aaAttributeType.isSlider || aaAttributeType.isAccordion || aaAttributeType.isMarquee) {
      if (enableGSAP) {
        setupInteractiveComponent(element, settings, modules, initOptions, aaAttributeType);
      }
    }

    // Setup regular animations (non-text)
    if (aaAttributeType.isAnimate) {
      if (enableGSAP) {
        setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
      } else {
        element.style.visibility = 'visible';
        setupIntersectionObserver(element, settings, initOptions);
      }
    }
  });
  
  // Batch process text elements with RAF to prevent forced reflows
  batchProcessTextElements(textElements, initOptions, isMobile, modules);
}

function setupInteractiveComponent(element, elementSettings, modules, initOptions, aaAttributeType) {
  const { sliderType, accordionType, marqueeType } = elementSettings;
  
  // Handle slider components
  if (aaAttributeType.isSlider) {
    // Skip if slider type is 'none' (useful for mobile variants like 'draggable|none')
    if (sliderType === 'none') {
      return;
    }
    
    if (initOptions.gsapFeatures.includes('slider')) {
      const { duration, ease, delay } = elementSettings;
      // Pass the slider type directly - the slider system uses feature detection with .includes()
      modules.animations.slider(element, sliderType, duration, ease, delay);
    }
  }
  
  // Handle accordion components
  if (aaAttributeType.isAccordion) {
    // Skip if accordion type is 'none' (useful for mobile variants)
    if (accordionType === 'none') {
      return;
    }
    
    if (initOptions.gsapFeatures.includes('accordion')) {
      modules.animations.accordion(element, accordionType);
    }
  }
  
  // Handle marquee components
  if (aaAttributeType.isMarquee) {
    // Skip if marquee type is 'none' (useful for mobile variants)
    if (marqueeType === 'none') {
      return;
    }
    
    if (initOptions.gsapFeatures.includes('marquee')) {
      const { duration, scrub } = elementSettings;
      // Pass the marquee type directly - the marquee system uses feature detection
      modules.animations.marquee(element, duration, scrub, marqueeType);
    }
  }
}

// Cache for feature availability checks - checked once per animation type, not per element
const featureAvailabilityCache = new Map();

function setupGSAPAnimations(element, elementSettings, initOptions, isMobile, modules) {
  const { animationType, split, scrub, duration, stagger, delay, ease, opacity, distance, anchorElement, anchorSelector, scrollStart, scrollEnd } = elementSettings;
  
  // 0. Check if this is a hybrid element (has both aa-load and aa-animate)
  const isHybridElement = element.hasAttribute('aa-load') && element.hasAttribute('aa-animate');
  const gracePeriodExpired = document.body.hasAttribute('aa-load-grace-expired');
  
  // If hybrid element and grace period expired, CSS animations have taken over - skip GSAP
  if (isHybridElement && gracePeriodExpired) {
    if (initOptions.debug) {
      console.log('AlrdyAnimate: Loading grace period expired, CSS load animations run instead of GSAP');
    }
    element.style.visibility = 'visible';
    return;
  }
  
  // 1. Variables setup
  const baseType = animationType.includes('-') ? animationType.split('-')[0] : animationType;
  const gsapAnimations = ['appear', 'reveal', 'counter', 'grow', 'text', 'background', 'parallax', 'clip', 'stack', 'pin'];
  
  // 2. Check if this is a GSAP animation BEFORE creating timeline
  const isGSAPAnimation = gsapAnimations.includes(baseType);
  
  // 3. Early check: verify required animation function exists (cached for performance)
  if (isGSAPAnimation) {
    // Check cache first
    if (!featureAvailabilityCache.has(baseType)) {
      // Feature map for first-time checks
      const animationFeatureMap = {
        'appear': { feature: 'appear', check: () => modules.animations.appear },
        'reveal': { feature: 'appear', check: () => modules.animations.reveal },
        'counter': { feature: 'appear', check: () => modules.animations.counter },
        'grow': { feature: 'appear', check: () => modules.animations.grow },
        'text': { feature: 'text', check: () => modules.splitText && modules.animations.text },
        'clip': { feature: 'section', check: () => modules.animations.clip },
        'stack': { feature: 'section', check: () => modules.animations.stack },
        'pin': { feature: 'section', check: () => modules.animations.pin || modules.animations.pinStack },
        'background': { feature: 'section', check: () => modules.animations.backgroundColor },
        'parallax': { feature: 'section', check: () => modules.animations.parallax }
      };
      
      if (animationFeatureMap[baseType]) {
        const { feature, check } = animationFeatureMap[baseType];
        const isAvailable = check();
        featureAvailabilityCache.set(baseType, { available: isAvailable, feature });
        
        if (!isAvailable) {
          console.warn(`AlrdyAnimate: '${baseType}' animation requires '${feature}' feature in gsapFeatures. Skipping animation for element:`, element);
        }
      }
    }
    
    // Use cached result
    const cachedResult = featureAvailabilityCache.get(baseType);
    if (cachedResult && !cachedResult.available) {
      return; // Skip this element
    }
  }
  
  // 4. Determine if this animation type creates its own ScrollTriggers
  const ownScrollTriggerAnimations = ['clip', 'stack', 'background', 'parallax', 'pin'];
  const hasOwnScrollTrigger = ownScrollTriggerAnimations.includes(baseType);

  // Clear existing animations
  if (element.timeline) element.timeline.kill();
  if (element.splitInstance) element.splitInstance.revert();
  // Kill old ScrollTriggers for this element
  if (element.scrollTriggers) {
    element.scrollTriggers.forEach(st => st.kill());
    element.scrollTriggers = [];
  }

  // 5. Create timeline and ScrollTrigger setup
  let tl = null;
  
  // Create timeline only for GSAP animations
  if (isGSAPAnimation && !hasOwnScrollTrigger) {
    tl = modules.gsap.timeline({
      paused: !scrub
    });
    element.timeline = tl;
  }
  
  // Create ScrollTriggers for both GSAP and CSS animations (but only if not event-triggered)
  if (!hasOwnScrollTrigger) {
    const useEventTrigger = element.hasAttribute('aa-event-trigger');
    
    if (useEventTrigger) {
      // Event-triggered elements: Skip ScrollTrigger creation, will be triggered by events
      if (element.timeline) {
        element.timeline.pause();
      }
      element.scrollTriggers = [];
      
      // Set up event listener for aa-event-trigger events
      element.addEventListener('aa-event-trigger', (e) => {
        const { action } = e.detail;
        
        if (action === 'play') {
          element.classList.add('in-view');
          element.style.visibility = 'visible';
          if (element.timeline) {
            element.timeline.timeScale(1).play();
          }
        } else if (action === 'reverse') {
          element.classList.remove('in-view');
          if (element.timeline) {
            element.timeline.timeScale(2).reverse();
          }
        }
      });
    } else {
      // Get pinnedContainer reference if element is marked (card 1 in pin-stack)
      const pinnedContainerId = element.getAttribute('aa-pinned-container');
      const pinnedContainer = pinnedContainerId ? document.getElementById(pinnedContainerId) : null;
      
      // Create ScrollTriggers for both GSAP and CSS animations
      const mainTrigger = modules.ScrollTrigger.create({
        trigger: anchorElement,
        ...(pinnedContainer ? { pinnedContainer: pinnedContainer } : {}),
        ...(scrub ? {
          start: scrollStart,
          end: scrollEnd,
          stagger,
          scrub: scrub ? 
            (parseFloat(scrub) || true)
          : false,
          invalidateOnRefresh: scrub ? false : true,
        } : {
          start: scrollStart
        }),
        ...(tl ? { animation: tl } : {}), // Only add animation if timeline exists
        onEnter: () => {
          element.classList.add("in-view");
          // For scrubbed animations, visibility is controlled by the animation itself
          if (!scrub) {
            modules.gsap.set(element, { visibility: 'visible' });
            if (tl) tl.play(); // Only play if timeline exists
          }
        },
        markers: initOptions.debug
      });

      const resetTrigger = modules.ScrollTrigger.create({
        trigger: anchorElement,
        ...(pinnedContainer ? { pinnedContainer: pinnedContainer } : {}),
        start: 'top 100%',
        onLeaveBack: () => {
          if (initOptions.again || anchorSelector) {
            element.classList.remove("in-view");
            if (tl) tl.progress(0).pause(); // Only reset if timeline exists
          }
        }
      });

      element.scrollTriggers = [mainTrigger, resetTrigger];
    }
  } // End of !hasOwnScrollTrigger

  // 6. Return early if not a GSAP animation (now after timeline check)
  if (!isGSAPAnimation) {
    return;
  }

  // 5. Handle GSAP animations
  // Animations with own ScrollTriggers (pin, clip, stack, background, parallax) must be synchronous
  // to maintain DOM order. Other animations use RAF unless they are scrubbed.
  
  // Handle animations that create their own ScrollTriggers (must be synchronous)
  if (hasOwnScrollTrigger) {
    switch(baseType) {
      case 'clip':
        modules.animations.clip(element);
        return;

      case 'stack':
        modules.animations.stack(element, scrub, distance);
        return;

      case 'pin':
        // Parse pin-specific attributes locally (no responsive parsing needed since pin is disabled on mobile)
        const pinStart = element.getAttribute('aa-pin-start') || 'top 10%';
        const pinEnd = element.getAttribute('aa-pin-end') || '+=100%';
        
        if (animationType === 'pin-stack') {
          // Get in and out animation types from attributes
          const inAnimation = element.getAttribute('aa-pin-in') || null;
          const outAnimation = element.getAttribute('aa-pin-out') || null;
          modules.animations.pinStack(element, pinStart, pinEnd, initOptions.debug, inAnimation, outAnimation);
        } else {
          modules.animations.pin(element, pinStart, pinEnd, initOptions.debug);
        }
        return;

      case 'background':
        modules.animations.backgroundColor(element, duration, ease, scrollStart, scrollEnd, initOptions.debug, scrub);
        return;

      case 'parallax':
        modules.animations.parallax(element, scrub, animationType);
        return;
    }
  }
  
  // Handle animations that use the shared timeline
  const setupMainTimelineAnimation = () => {
    switch(baseType) {
      case 'appear':
        tl.add(modules.animations.appear(element, duration, ease, delay, distance, animationType, opacity));
        break;

      case 'reveal':
        tl.add(modules.animations.reveal(element, duration, ease, delay, animationType, opacity));
        break;

      case 'counter':
        tl.add(modules.animations.counter(element, duration, ease, delay, animationType));
        break;

      case 'grow':
        tl.add(modules.animations.grow(element, duration, ease, delay, animationType));
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
  };
  
  // Scrubbed animations must be synchronous to ensure timeline content exists before ScrollTrigger binds
  // Other animations can use RAF for better performance
  if (scrub) {
    setupMainTimelineAnimation();
  } else {
    requestAnimationFrame(setupMainTimelineAnimation);
  }
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
        // Extract base type (circle, curve, expand) from bg-[type]-[direction]
        const bgType = subtypes[0]; // Get the first subtype (circle, curve, expand)
        modules.animations.initializeBackgroundHover(element, {
          ...elementSettings,
          hoverType: type
        }, bgType);
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