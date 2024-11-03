import styles from "../scss/AlrdyAnimate.scss";
import { GSAPBundleManager } from './gsapBundles/bundleManager';
import debounce from 'lodash.debounce';

// Module scope variables
let bundleManager = null;
let allAnimatedElements = null;
let settings = null;
let isMobile = false;

// Default options
const defaultOptions = {
  easing: "ease", // Default easing function for animations
  again: true, // True = removes 'in-view' class when element is out of view towards the bottom
  viewportPercentage: 0.8, // Default percentage of the viewport height to trigger the animation
  enableTextAnimations: false,    // For text splitting and scroll-based animations
  enableDragAnimations: false,    // For draggable elements
  duration: 1, // 1 second
  delay: 0, // 0 seconds
  debug: false // Set to true to see GSAP debug info
};

// Initialize the animation script
async function init(settings = {}) {
  try {
    settings = { ...defaultOptions, ...settings };
    bundleManager = new GSAPBundleManager();
    
    allAnimatedElements = document.querySelectorAll(
      "[aa-animate], [aa-children]"
    );
    isMobile = window.innerWidth < 768;

    // Fallback for browsers that don't support IntersectionObserver
    if (!("IntersectionObserver" in window) && !settings.enableTextAnimations) {
      allAnimatedElements.forEach((element) => {
        element.classList.add("in-view");
      });
      return {
        gsap: AlrdyAnimate.gsap
      };
    }

    // Set easing on the body element
    document.body.setAttribute("aa-easing", settings.easing);

    return new Promise((resolve) => {
      window.addEventListener('load', async () => {
        try {
          // Initialize text animations (includes ScrollTrigger and text splitting)
          if (settings.enableTextAnimations) {
            const scrollTextBundle = await bundleManager.loadBundle('scrollText');
            const { ScrollTrigger } = scrollTextBundle.plugins;
            
            // Make available globally and as exports
            window.ScrollTrigger = ScrollTrigger;
            window.gsap = bundleManager.gsap;
            AlrdyAnimate.ScrollTrigger = ScrollTrigger;
            AlrdyAnimate.gsap = bundleManager.gsap;
            
            // Debug logs
            console.log('Bundle loaded:', scrollTextBundle);
            console.log('ScrollTrigger:', ScrollTrigger);
            console.log('GSAP:', bundleManager.gsap);
            console.log('AlrdyAnimate.ScrollTrigger:', AlrdyAnimate.ScrollTrigger);
            
            // Set up sticky nav
            const navElement = document.querySelector('[aa-nav="sticky"]');
            if (navElement) {
              const navEase = navElement.getAttribute('aa-easing');
              const navDuration = navElement.getAttribute('aa-duration');
              scrollTextBundle.animations.stickyNav(navElement, navEase, navDuration);
            }

            // Set up resize handler and lazy image loading
            setupResizeHandler(ScrollTrigger);
            handleLazyLoadedImages(ScrollTrigger);

            const result = {
              gsap: AlrdyAnimate.gsap,
              ScrollTrigger: AlrdyAnimate.ScrollTrigger
            };
            
            console.log('About to return:', result);
            resolve(result);
          }

          // Initialize drag animations
          if (settings.enableDragAnimations) {
            const dragBundle = await bundleManager.loadBundle('drag');
            const { Draggable } = dragBundle.plugins;
            
            // Make available globally and as exports
            window.Draggable = Draggable;
            AlrdyAnimate.Draggable = Draggable;
          }

          // Get all loaded animations
          const animations = bundleManager.getAnimations();

          // Set up animations with all loaded bundles
          if (Object.keys(animations).length > 0) {
            setupAnimations(allAnimatedElements, settings, isMobile, animations);
            resolve(bundleManager);
          } else {
            // If no animations are enabled, make elements visible
            allAnimatedElements.forEach((element) => {
              element.style.visibility = 'visible';
            });
            resolve(null);
          }

        } catch (error) {
          console.error('Failed to load animation bundles:', error);
          // Make all elements visible if loading fails
          allAnimatedElements.forEach((element) => {
            element.style.visibility = 'visible';
          });
          // Fallback to basic setup without animations
          setupAnimations(allAnimatedElements, settings, isMobile);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error initializing AlrdyAnimate:', error);
    return Promise.reject(error);
  }
}

// Handle resize events
function setupResizeHandler(ScrollTrigger) {
  let prevWidth = window.innerWidth;

  const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    
    if (currentWidth !== prevWidth) {
      isMobile = currentWidth < 768;
      ScrollTrigger.refresh();
      /* setupAnimations(allAnimatedElements, settings, isMobile, bundleManager.getAnimations()); // Re-setup animations */
      prevWidth = currentWidth;
    }
  }, 250);

  // Handle both resize and orientation change with the same debounced function
  window.addEventListener('resize', debouncedResize);
  window.addEventListener('orientationchange', debouncedResize);

}

// Setup animations for elements
function setupAnimations(elements, settings, isMobile, animations = null) {
  // First, process parent elements with aa-children attribute
  elements.forEach((element) => {
    if (element.hasAttribute("aa-children")) {
      const children = Array.from(element.children);
      const parentDelay = element.hasAttribute("aa-delay") ? parseFloat(element.getAttribute("aa-delay")) : settings.delay;
      const stagger = element.hasAttribute("aa-stagger") ? parseFloat(element.getAttribute("aa-stagger")) : 0;
      const animationType = element.getAttribute("aa-children"); // Get the animation type
      
      // Copy relevant attributes from parent to children
      children.forEach((child, index) => {

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
      setupAnimations(children, settings, isMobile, animations);
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
      setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, delay, settings, animations, isMobile);
    } else {
      setupIntersectionObserver(element, anchorSelector, anchorElement, viewportPercentage, settings);
    }
  });
}

function setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, delay, settings, animations, isMobile) {
  const animationType = element.getAttribute('aa-animate');
  const splitTypeAttr = element.getAttribute('aa-split');
  const scroll = element.getAttribute('aa-scroll');
  const duration = element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute("aa-duration")) : undefined;
  const stagger = element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : undefined;
  const ease = element.hasAttribute('aa-easing') ? element.getAttribute('aa-easing') : undefined;
  const splitText = settings.enableTextAnimations ? 
    bundleManager.loadedBundles.get('scrollText')?.utils?.splitText : 
    null;

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

function handleLazyLoadedImages(ScrollTrigger) {
  let needsRefresh = false;

  const debouncedRefresh = debounce(() => {
    if (needsRefresh) {
      ScrollTrigger.refresh();
      needsRefresh = false;
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

// Create the AlrdyAnimate object
const AlrdyAnimate = {
  init,
  gsap: null,
  ScrollTrigger: null,
  Draggable: null,
  // Add getter methods
  getGSAP() {
    return this.gsap;
  },
  getScrollTrigger() {
    return this.ScrollTrigger;
  },
  getDraggable() {
    return this.Draggable;
  }
};

// Named exports for individual plugins
export const { gsap, ScrollTrigger, Draggable } = AlrdyAnimate;

// Default export for the main library
export default AlrdyAnimate;

// Optional: Attach to window for direct browser usage
if (typeof window !== 'undefined') {
  window.AlrdyAnimate = AlrdyAnimate;
}
