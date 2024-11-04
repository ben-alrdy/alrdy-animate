import { getElementSettings, applyElementStyles } from '../utils/elementAttributes';
import { processChildren } from '../utils/childrenHandler';
import { setupGSAPAnimation } from './setupGsapAnimation';
import { setupIntersectionObserver } from './setupIntersectionObserver';

export function setupAnimations(elements, settings, isMobile, animations = null, splitText = null) {
  elements.forEach((element) => {
    // Handle children elements
    if (element.hasAttribute("aa-children")) {
      const children = processChildren(element, settings);
      setupAnimations(children, settings, isMobile, animations, splitText);
      return;
    }

    // Apply styles and get settings
    applyElementStyles(element, settings, isMobile);
    const elementSettings = getElementSettings(element, settings, isMobile);
    
    // Get anchor element
    const anchorElement = elementSettings.anchorSelector ? 
      document.querySelector(elementSettings.anchorSelector) : 
      element;

    // Setup appropriate animation type
    if (settings.useGSAP) {
      setupGSAPAnimation(element, anchorElement, elementSettings, settings, animations, splitText, isMobile);
    } else {
      setupIntersectionObserver(element, anchorElement, elementSettings, settings);
    }
  });
} 