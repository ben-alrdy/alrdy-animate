// Store defaults passed during initialization
let storedDefaults = { duration: 1, delay: 0 };

/**
 * Initialize the animation event trigger with default values
 * Called once during AlrdyAnimate.init
 * @param {Object} defaults - { duration, delay }
 */
export function initAnimationEventTrigger(defaults) {
  storedDefaults = { ...storedDefaults, ...defaults };
}

/**
 * Trigger animations on multiple elements
 * @param {Array|NodeList} elements - Elements with aa-animate attributes
 * @param {string} action - 'play' (1x speed) or 'reverse' (2x speed)
 */
export function triggerAnimations(elements, action) {
  const timeScale = action === 'reverse' ? 2 : 1; // Hardcoded: reverse is always 2x faster
  
  elements.forEach(element => {
    const originalDelay = parseFloat(element.getAttribute('aa-delay')) || storedDefaults.delay;
    const originalDuration = parseFloat(element.getAttribute('aa-duration')) || storedDefaults.duration;
    
    const adjustedDelay = originalDelay / timeScale;
    const adjustedDuration = originalDuration / timeScale;
    
    // For CSS animations, update CSS custom properties to make them faster
    if (!element.timeline) {
      element.style.setProperty('--aa-duration', `${adjustedDuration}s`);
      element.style.setProperty('--aa-delay', `${adjustedDelay}s`);
    }
    
    element.dispatchEvent(new CustomEvent('aa-event-trigger', {
      detail: { 
        action: action
      }
    }));
  });
}

