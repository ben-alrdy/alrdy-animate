export function setupIntersectionObserver(element, anchorElement, elementSettings, settings) {
  const bottomMargin = (1 - elementSettings.viewportPercentage) * 100;
  const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;

  setupAddObserver(element, anchorElement, rootMarginValue);
  setupRemoveObserver(element, anchorElement, elementSettings, settings);
}

function setupAddObserver(element, anchorElement, rootMarginValue) {
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

  addObserver.observe(anchorElement);
}

function setupRemoveObserver(element, anchorElement, elementSettings, settings) {
  const removeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const rect = entry.target.getBoundingClientRect();
        if (
          !entry.isIntersecting &&
          rect.top >= window.innerHeight &&
          (settings.again || elementSettings.anchorSelector)
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

  removeObserver.observe(anchorElement);
} 