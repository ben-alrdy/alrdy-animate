import styles from '../scss/AlrdyAnimate.scss';

import throttle from './utils/throttle';

document.addEventListener("DOMContentLoaded", () => {
    const isMobile = window.innerWidth < 768;
  
    // Observers map to handle unique viewport percentages
    const observersMap = {};
  
    // Get all the elements with the aa attribute
    const allAnimatedElements = document.querySelectorAll('[aa-animate]');
  
    allAnimatedElements.forEach(element => {
      const aaMobile = element.getAttribute('aa-mobile');
      const viewportPercentageAttr = element.getAttribute('aa-viewport');
      let viewportPercentage = viewportPercentageAttr ? parseFloat(viewportPercentageAttr) : 0.8;
      let delay = element.getAttribute('aa-delay');
  
      if (isMobile) {
        if (aaMobile && aaMobile === 'no-delay') {
          delay = null;
        }
        viewportPercentage = 0.8; // Default to 80% on mobile
      }
  
      if (delay) {
        element.style.animationDelay = delay;
      }
  
      if (!isNaN(viewportPercentage) && viewportPercentage >= 0 && viewportPercentage <= 1) {
        // Calculate rootMargin based on the viewport percentage
        const bottomMargin = (1 - viewportPercentage) * 100;
        const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;
  
        // Check if an observer for this root margin already exists
        if (!observersMap[rootMarginValue]) {
          // Create a new observer with the specific root margin
          observersMap[rootMarginValue] = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              const rect = entry.target.getBoundingClientRect();
              console.log(`Element: ${entry.target.id}, Rect.top: ${rect.top}, Window.innerHeight: ${window.innerHeight}`);
  
              if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                console.log(`Added 'in-view' class to ${entry.target.id}`);
              } else {
                if (rect.top >= window.innerHeight) {
                  // Element is leaving the viewport towards the bottom
                  entry.target.classList.remove('in-view');
                  console.log(`Removed 'in-view' class from ${entry.target.id}`);
                }
                // No action needed for elements leaving towards the top
              }
            });
          }, {
            rootMargin: rootMarginValue
          });
        }
  
        // Add the element to the appropriate observer
        observersMap[rootMarginValue].observe(element);
      }
    });
  });