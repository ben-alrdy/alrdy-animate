import styles from "../scss/AlrdyAnimate.scss";

// Default options for the animation settings
const defaultOptions = {
  easing: 'ease',            // Default easing function for animations
  again: true,               // True = removes 'in-view' class when element is out of view
  viewportPercentage: 0.8,   // Default percentage of the viewport height to trigger the animation
  duration: '1s',            // Default animation duration
  delay: '0s'                // Default animation delay
};

// Initialize the animation script with the given options
function init(options = {}) {
  const settings = { ...defaultOptions, ...options };
  const allAnimatedElements = document.querySelectorAll("[aa-animate], [aa-transition]");
  const isMobile = window.innerWidth < 768;

  // Fallback for browsers that do not support IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    allAnimatedElements.forEach((element) => {
      element.classList.add("in-view");
    });
    return; // Exit the script as the fallback is applied
  }

  // Set easing on the body element
  document.body.setAttribute("aa-easing", settings.easing);

  // Intersection Observer setup for supported browsers
  allAnimatedElements.forEach((element) => {
    const aaMobile = element.getAttribute("aa-mobile");
    const duration = element.getAttribute("aa-duration") || settings.duration;
    const delay = element.getAttribute("aa-delay") || settings.delay;
    const colorInitial = element.getAttribute("aa-color-initial");
    const colorFinal = element.getAttribute("aa-color-final");
    const anchorSelector = element.getAttribute("aa-anchor");
    let anchorElement = element;

    // Set animation duration and delay based on attributes or default settings
    element.style.setProperty("--animation-duration", duration);

    if (isMobile && aaMobile === "no-delay") {
      element.style.setProperty("--animation-delay", "0s");
    } else {
      element.style.setProperty("--animation-delay", delay);
    }

    // Set background colors based on attributes
    if (colorInitial) {
      element.style.setProperty("--background-color-initial", colorInitial);
    }
    if (colorFinal) {
      element.style.setProperty("--background-color-final", colorFinal);
    }

    // Use the anchor element if specified
    if (anchorSelector) {
      anchorElement = document.querySelector(anchorSelector);
    }

    // Get viewport percentage for triggering animation
    const viewportPercentageAttr = element.getAttribute("aa-viewport");
    let viewportPercentage = viewportPercentageAttr
      ? parseFloat(viewportPercentageAttr)
      : settings.viewportPercentage;

    if (viewportPercentage >= 0 && viewportPercentage <= 1) {
      // Calculate the bottom margin based on the viewport percentage
      const bottomMargin = (1 - viewportPercentage) * 100;
      // Set the root margin to trigger the observer when the element is within the specified viewport percentage
      const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;

      // Observer to add 'in-view' class
      const addObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
            }
          });
        },
        {
          threshold: [0, 1], // Trigger callback when any part or the whole element is visible
          rootMargin: rootMarginValue,
        }
      );

      // Observer to remove 'in-view' class and add 'out-of-view' class
      const removeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const rect = entry.target.getBoundingClientRect();
            if (!entry.isIntersecting && rect.top >= window.innerHeight && (settings.again || anchorSelector)) {
              entry.target.classList.remove("in-view");
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
  });
}

const AlrdyAnimate = { init };
export { AlrdyAnimate };

// Attach to global namespace if needed
window.AlrdyAnimate = AlrdyAnimate;