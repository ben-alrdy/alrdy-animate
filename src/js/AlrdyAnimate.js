import styles from "../scss/AlrdyAnimate.scss";
import { createAnimations } from './gsapAnimations';

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
  const isMobile = window.innerWidth < 768;

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
          const { gsap } = await import('gsap');
          const { ScrollTrigger } = await import('gsap/ScrollTrigger');
          gsap.registerPlugin(ScrollTrigger);
          
          const animations = await createAnimations();
          setupAnimations(allAnimatedElements, settings, isMobile, gsap, ScrollTrigger, animations);
        } catch (error) {
          console.error('Failed to load GSAP:', error);
          allAnimatedElements.forEach((element) => {
            element.style.visibility = 'visible'; // Make all elements visible that were hidden for GSAP animations
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
function setupAnimations(elements, settings, isMobile, gsap = null, ScrollTrigger = null, animations = null) {
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



    if (settings.useGSAP && gsap && ScrollTrigger && animations) {
      setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, settings, gsap, ScrollTrigger, animations);
    } else {
      setupIntersectionObserver(element, anchorSelector, anchorElement, viewportPercentage, settings);
    }
  });
}

function setupGSAPAnimation(element, anchorSelector, anchorElement, viewportPercentage, settings, gsap, ScrollTrigger, animations) {
  const animationType = element.getAttribute('aa-animate');
  const splitType = element.getAttribute('aa-split');
  const duration = element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : undefined;
  const stagger = element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : undefined;
  const ease = element.hasAttribute('aa-easing') ? element.getAttribute('aa-easing') : undefined;
  
  // Split text
  const splitText = animations.splitText(element, splitType);

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

    // Choose the animation based on the attribute
    switch(animationType) {
      case 'textSlideUp':
        tl.add(animations.textSlideUp(element, splitText, splitType, duration, stagger, ease));
        break;
      case 'textSlideDown':
        tl.add(animations.textSlideDown(element, splitText, splitType, duration, stagger, ease));
        break;
      case 'textRotateUp':
        tl.add(animations.textRotateUp(element, splitText, splitType, duration, stagger, ease));
        break;
      case 'textRotateDown':
        tl.add(animations.textRotateDown(element, splitText, splitType, duration, stagger, ease));
        break;
      case 'textCascadeUp':
        tl.add(animations.textCascadeUp(element, splitText, duration, stagger, ease));
        break;
      case 'textCascadeDown':
        tl.add(animations.textCascadeDown(element, splitText, duration, stagger, ease));
        break;
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
