import styles from '../scss/AlrdyAnimate.scss';

// import throttle from './utils/throttle';

document.addEventListener("DOMContentLoaded", () => {
    const allAnimatedElements = document.querySelectorAll('[aa-animate]');
  
    allAnimatedElements.forEach(element => {
      const viewportPercentageAttr = element.getAttribute('aa-viewport');
      let viewportPercentage = viewportPercentageAttr ? parseFloat(viewportPercentageAttr) : 0.8;
  
      if (!isNaN(viewportPercentage) && viewportPercentage >= 0 && viewportPercentage <= 1) {
        // Calculate rootMargin based on the viewport percentage for the primary observer
        const bottomMargin = (1 - viewportPercentage) * 100;
        const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;
  
        // Primary observer to add 'in-view' class
        const addObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              console.log(`Added 'in-view' class to ${entry.target.id}`);
            }
          });
        }, {
          threshold: [0, 1], // Trigger callback when any part or the whole element is visible
          rootMargin: rootMarginValue
        });
  
        // Secondary observer to remove 'in-view' class when moving out of the viewport from the bottom
        const removeObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const rect = entry.target.getBoundingClientRect();
            if (!entry.isIntersecting && rect.top >= window.innerHeight) {
              entry.target.classList.remove('in-view');
              console.log(`Removed 'in-view' class from ${entry.target.id}`);
            }
          });
        }, {
          threshold: 0, // Trigger callback when the element is not visible at all
          rootMargin: '0px' // Ensure this observer uses the full viewport
        });
  
        const delay = element.getAttribute('aa-delay');
        if (delay) {
          element.style.animationDelay = delay;
        }
  
        addObserver.observe(element);
        removeObserver.observe(element);
      }
    });
  });