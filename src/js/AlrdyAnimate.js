import styles from "../scss/AlrdyAnimate.scss";

// import throttle from './utils/throttle';

document.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.innerWidth < 768;
  const allAnimatedElements = document.querySelectorAll("[aa-animate]");

  allAnimatedElements.forEach((element) => {
    const aaMobile = element.getAttribute("aa-mobile");
    const duration = element.getAttribute("aa-duration");
    const delay = element.getAttribute("aa-delay");
    const anchorSelector = element.getAttribute("aa-anchor");
    let anchorElement = element;

    if (duration) {
      element.style.setProperty("--animation-duration", duration);
    }

    if (isMobile && aaMobile === "no-delay") {
      element.style.setProperty("--animation-delay", "0s");
    } else if (delay) {
      element.style.setProperty("--animation-delay", delay);
    }

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
      // Calculate rootMargin based on the viewport percentage for the primary observer
      const bottomMargin = (1 - viewportPercentage) * 100;
      const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;

      // Primary observer to add 'in-view' class
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

      // Secondary observer to remove 'in-view' class when moving out of the viewport from the bottom
      const removeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const rect = entry.target.getBoundingClientRect();
            if (!entry.isIntersecting && rect.top >= window.innerHeight) {
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
});
