import styles from "../scss/AlrdyAnimate.scss";

// Default options for the animation settings
const defaultOptions = {
  easing: "ease", // Default easing function for animations
  again: true, // True = removes 'in-view' class when element is out of view
  viewportPercentage: 0.8, // Default percentage of the viewport height to trigger the animation
};

// Initialize the animation script with the given options
function init(options = {}) {
  const settings = { ...defaultOptions, ...options };
  const allAnimatedElements = document.querySelectorAll(
    "[aa-animate], [aa-transition]"
  );
  const isMobile = window.innerWidth < 768;

  // Fallback for browsers that do not support IntersectionObserver
  if (!("IntersectionObserver" in window)) {
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
    const duration = element.getAttribute("aa-duration") || options.duration;
    const delay = element.getAttribute("aa-delay") || options.delay;
    const colorInitial = element.getAttribute("aa-color-initial") || options.color-initial;
    const colorFinal = element.getAttribute("aa-color-final") || options.color-final;
    const anchorSelector = element.getAttribute("aa-anchor");
    let anchorElement = element; // The 'anchorElement' will be observed, while the 'element' gets the in-view class

    // Use the anchor element (if specified) to trigger the animation for element
    if (anchorSelector) {
      anchorElement = document.querySelector(anchorSelector);
    }

    // Set animation duration and delay based on attributes or init options
    if (duration) {
      element.style.setProperty("--animation-duration", duration);
    }

    // Set animation delay based on attributes, init options, and mobile settings
    if (isMobile && aaMobile === "no-delay") {
      element.style.setProperty("--animation-delay", "0s");
    } else if (delay) {
      element.style.setProperty("--animation-delay", delay);
    }

    // Set background colors based on attributes
    if (colorInitial) {
      element.style.setProperty("--background-color-initial", colorInitial);
    }
    if (colorFinal) {
      element.style.setProperty("--background-color-final", colorFinal);
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
              element.classList.add("in-view");
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
  });
}

const AlrdyAnimate = { init };
export { AlrdyAnimate };

// Attach to global namespace if needed
window.AlrdyAnimate = AlrdyAnimate;
