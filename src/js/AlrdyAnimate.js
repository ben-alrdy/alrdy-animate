import styles from "../scss/AlrdyAnimate.scss";
import debounce from 'lodash.debounce';

// Default options for the animation settings
const defaultOptions = {
  easing: "ease", // Default easing function for animations
  again: true, // True = removes 'in-view' class when element is out of view towards the bottom
  viewportPercentage: 0.8, // Default percentage of the viewport height to trigger the animation
  useGSAP: false, // Use GSAP for animations
  duration: 1, // 1 second
  delay: 0 // 0 seconds
};

// Initialize the animation script with the given options
async function init(options = {}) {
  const settings = { ...defaultOptions, ...options };
  const allAnimatedElements = document.querySelectorAll(
    "[aa-animate], [aa-transition]"
  );
  let isMobile = window.innerWidth < 768;

  // Fallback for browsers that do not support IntersectionObserver
  if (!("IntersectionObserver" in window) && !settings.useGSAP) {
    allAnimatedElements.forEach((element) => {
      element.classList.add("in-view");
    });
    return; // Exit the script as the fallback is applied
  }

  // Set easing on the body element
  document.body.setAttribute("aa-easing", settings.easing);

  window.addEventListener('load', async () => {
    if (settings.useGSAP) {
      try {
        const { gsap, ScrollTrigger, animations, splitText, stickyNav } = await import('./gsapBundle'); // Import the gsap, ScrollTrigger, SplitText and animations modules

        // Set up sticky nav
        const navElement = document.querySelector('[aa-nav="sticky"]');
        if (navElement) {
          const navEase = navElement.getAttribute('aa-easing');
          const navDuration = navElement.getAttribute('aa-duration');
          stickyNav(gsap, ScrollTrigger, navElement, navEase, navDuration);
        }
        
        setupAnimations(allAnimatedElements, settings, isMobile, gsap, ScrollTrigger, animations, splitText);

        // Create a debounced function for the resize event
        const debouncedResize = debounce(() => {
          isMobile = window.innerWidth < 768;
          // Refresh all ScrollTriggers
          ScrollTrigger.refresh();
          // Re-setup animations
          setupAnimations(allAnimatedElements, settings, isMobile, gsap, ScrollTrigger, animations, splitText);
        }, 250);

        // Add resize event listener
        window.addEventListener('resize', debouncedResize);

      } catch (error) {
        console.error('Failed to load GSAP:', error);
        // Make all elements visible that were hidden for GSAP animations
        allAnimatedElements.forEach((element) => {
          element.style.visibility = 'visible'; 
        });
        // Fallback to non-GSAP animations if loading fails
        setupAnimations(allAnimatedElements, settings, isMobile);
      }
    } else {
      setupAnimations(allAnimatedElements, settings, isMobile);
    }
  });
}

// Setup animations for elements
function setupAnimations(elements, settings, isMobile, gsap = null, ScrollTrigger = null, animations = null, splitText = null) {
  elements.forEach((element) => {
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
      setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, delay, settings, gsap, ScrollTrigger, animations, splitText, isMobile);
    } else {
      setupIntersectionObserver(element, anchorSelector, anchorElement, viewportPercentage, settings);
    }
  });
}

function setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, delay, settings, gsap, ScrollTrigger, animations, splitText, isMobile) {
  const animationType = element.getAttribute('aa-animate');
  const splitTypeAttr = element.getAttribute('aa-split');
  const scroll = element.getAttribute('aa-scroll');
  const duration = element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : undefined;
  const stagger = element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : undefined;
  const ease = element.hasAttribute('aa-easing') ? element.getAttribute('aa-easing') : undefined;

  // Clear existing animation if any
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
       // markers: true
      }
    });

    element.timeline = tl; // Store the timeline on the element for future reference

    if (splitTypeAttr) {
      const { splitResult, splitType } = splitText(element, splitTypeAttr);
      element.splitInstance = splitResult; // Store the split instance on the element

      // Choose the animation based on the attribute
      switch(animationType) {
        case 'text-slide-up':
          tl.add(animations.textSlideUp(element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-slide-down':
          tl.add(animations.textSlideDown(element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-tilt-up':
          tl.add(animations.textTiltUp(element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-tilt-down':
          tl.add(animations.textTiltDown(element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-cascade-up':
          tl.add(animations.textCascadeUp(element, splitResult, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-cascade-down':
          tl.add(animations.textCascadeDown(element, splitResult, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-rotate-soft':
          tl.add(animations.textRotateSoft(element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-fade':
          tl.add(animations.textFade(element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll));
          break;
        case 'text-appear':
          tl.add(animations.textAppear(element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll));
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

const AlrdyAnimate = { init };
export { AlrdyAnimate };

// Attach to global namespace if needed
window.AlrdyAnimate = AlrdyAnimate;
