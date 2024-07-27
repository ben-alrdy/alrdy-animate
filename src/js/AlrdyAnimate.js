import styles from "../scss/AlrdyAnimate.scss";

const defaultOptions = {
  easing: 'ease'
};

function init(options = {}) {
  const settings = { ...defaultOptions, ...options };

  document.body.setAttribute("aa-easing", settings.easing);

  const isMobile = window.innerWidth < 768;
  const allAnimatedElements = document.querySelectorAll("[aa-animate], [aa-transition]");

  // Fallback for browsers that do not support IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    allAnimatedElements.forEach((element) => {
      element.classList.add("in-view");
    });
    return; // Exit the script as the fallback is applied
  }

  // Intersection Observer setup for supported browsers
  allAnimatedElements.forEach((element) => {
    const aaMobile = element.getAttribute("aa-mobile");
    const duration = element.getAttribute("aa-duration");
    const delay = element.getAttribute("aa-delay");
    const colorInitial = element.getAttribute("aa-color-initial");
    const colorFinal = element.getAttribute("aa-color-final");
    const anchorSelector = element.getAttribute("aa-anchor");
    let anchorElement = element;

    // Set animation duration and delay based on attributes
    if (duration) {
      element.style.setProperty("--animation-duration", duration);
    }

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

    // Use the anchor element if specified
    if (anchorSelector) {
      anchorElement = document.querySelector(anchorSelector);
    }

    const viewportPercentageAttr = element.getAttribute("aa-viewport");
    let viewportPercentage = viewportPercentageAttr
      ? parseFloat(viewportPercentageAttr)
      : 0.8;

    if (
      !isNaN(viewportPercentage) &&
      viewportPercentage >= 0 &&
      viewportPercentage <= 1
    ) {
      const bottomMargin = (1 - viewportPercentage) * 100;
      const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;

      // Observer to add 'in-view' class
      const addObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            console.log('Entry observed for adding in-view:', entry); // Added log
            if (entry.isIntersecting) {
              console.log('Adding in-view class to element:', entry.target);
              entry.target.classList.add("in-view");
            }
          });
        },
        {
          threshold: [0, 1],
          rootMargin: rootMarginValue,
        }
      );

      // Observer to remove 'in-view' class and add 'out-of-view' class
      const removeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const rect = entry.target.getBoundingClientRect();
            console.log('Entry observed for removing in-view:', entry); // Added log
            if (!entry.isIntersecting && rect.top >= window.innerHeight) {
              console.log('Removing in-view class from element:', entry.target);
              entry.target.classList.remove("in-view");
            }
          });
        },
        {
          threshold: 0,
          rootMargin: "0px",
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