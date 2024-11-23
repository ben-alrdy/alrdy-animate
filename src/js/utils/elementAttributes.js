export function getElementSettings(element, settings) {
  const animationType = element.getAttribute('aa-animate');
  const anchorSelector = element.getAttribute("aa-anchor");
  const anchorElement = anchorSelector ? document.querySelector(anchorSelector) : element;

  return {
    // Animation properties
    animationType,
    ease: element.hasAttribute('aa-ease') ? element.getAttribute('aa-ease') : settings.ease,
    splitType: element.getAttribute('aa-split'),
    scroll: element.getAttribute('aa-scroll'),
    distance: element.hasAttribute('aa-distance') ? parseFloat(element.getAttribute('aa-distance')) : settings.distance,

    // Animation timing
    duration: element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : undefined,
    delay: element.hasAttribute('aa-delay') ? parseFloat(element.getAttribute('aa-delay')) : undefined,
    delayMobile: element.hasAttribute('aa-delay-mobile') ? parseFloat(element.getAttribute('aa-delay-mobile')) : undefined,
    stagger: element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : undefined,
    
    // Colors
    colorInitial: element.getAttribute("aa-color-initial") || settings.colorInitial,
    colorFinal: element.getAttribute("aa-color-final") || settings.colorFinal,
    
    // Viewport and anchoring
    viewportPercentage: element.hasAttribute('aa-viewport') ? parseFloat(element.getAttribute('aa-viewport')) : settings.viewportPercentage,
    anchorSelector,
    anchorElement,
    
    // Parent-specific attributes
    isParent: element.hasAttribute("aa-children"),
    childrenAnimation: element.getAttribute("aa-children")
  };
}

export function applyElementStyles(element, elementSettings, isMobile) {
  const { duration, delay, distance, delayMobile, colorInitial, colorFinal } = elementSettings;

  // Set duration if specified on element
  if (element.hasAttribute('aa-duration')) {
    element.style.setProperty("--animation-duration", `${duration}s`);
  }

  // Set delay if specified on element, and handle mobile delay if defined
  if (element.hasAttribute('aa-delay')) {
    const finalDelay = isMobile && delayMobile !== undefined ? delayMobile : delay;
    element.style.setProperty("--animation-delay", `${finalDelay}s`);
  }

  // Set distance if specified on element
  if (element.hasAttribute('aa-distance')) {
    element.style.setProperty("--aa-distance-factor", `${distance}`);
  }

  if (colorInitial) {
    element.style.setProperty("--background-color-initial", colorInitial);
  }
  if (colorFinal) {
    element.style.setProperty("--background-color-final", colorFinal);
  }
} 