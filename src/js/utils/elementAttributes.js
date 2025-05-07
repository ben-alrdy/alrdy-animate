export function getElementSettings(element, settings) {
  // Handle mobile animations
  let animationType = element.getAttribute('aa-animate-original') || element.getAttribute('aa-animate');
  if (animationType && animationType.includes('|')) {
    // Store original value if not already stored
    if (!element.hasAttribute('aa-animate-original')) {
      element.setAttribute('aa-animate-original', animationType);
    }
    
    const [desktopAnim, mobileAnim] = animationType.split('|');
    animationType = window.innerWidth < 768 ? mobileAnim : desktopAnim;
    // Update the actual attribute for CSS animations
    element.setAttribute('aa-animate', animationType);
  }

  const hoverType = element.getAttribute('aa-hover');
  const anchorSelector = element.getAttribute("aa-anchor");
  const anchorElement = anchorSelector ? document.querySelector(anchorSelector) : element;
  const pseudoColor = animationType?.includes('#') ? '#' + animationType.split('#')[1] : undefined;

  return {
    // Animation properties
    animationType,
    ease: element.hasAttribute('aa-ease') ? element.getAttribute('aa-ease') : settings.ease,
    split: element.getAttribute('aa-split'),
    scrub: element.getAttribute('aa-scrub') || undefined,
    distance: element.hasAttribute('aa-distance') ? parseFloat(element.getAttribute('aa-distance')) : settings.distance,

    // Hover properties
    hoverType,
    hoverDirection: element.getAttribute('aa-hover-direction') || 'all',
    isReverse: hoverType ? hoverType.includes('reverse') : false,
    hoverDuration: element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : settings.hoverDuration,
    hoverDelay: element.hasAttribute('aa-delay') ? parseFloat(element.getAttribute('aa-delay')) : settings.hoverDelay,
    hoverEase: element.hasAttribute('aa-ease') ? element.getAttribute('aa-ease') : settings.hoverEase,
    hoverDistance: element.hasAttribute('aa-distance') ? parseFloat(element.getAttribute('aa-distance')) : settings.hoverDistance,
    hoverStagger: element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : 0.03,
    bg: element.querySelector('[aa-hover-bg]'),

    // Animation timing
    duration: element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : settings.duration,
    delay: element.hasAttribute('aa-delay') ? parseFloat(element.getAttribute('aa-delay')) : settings.delay,
    delayMobile: element.hasAttribute('aa-delay-mobile') ? parseFloat(element.getAttribute('aa-delay-mobile')) : undefined,
    stagger: element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : undefined,
    
    // Colors
    pseudoColor,
    
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
  const { duration, delay, distance, delayMobile, pseudoColor } = elementSettings;

  // Set duration if specified on element
  if (element.hasAttribute('aa-duration')) {
    element.style.setProperty("--aa-duration", `${duration}s`);
  }

  // Set delay if specified on element, and handle mobile delay if defined
  if (element.hasAttribute('aa-delay')) {
    const finalDelay = isMobile && delayMobile !== undefined ? delayMobile : delay;
    element.style.setProperty("--aa-delay", `${finalDelay}s`);
  }

  // Set distance if specified on element
  if (element.hasAttribute('aa-distance')) {
    element.style.setProperty("--aa-distance", `${distance}`);
  }

  if (element.getAttribute('aa-animate')?.includes('#')) {
    element.style.setProperty("--aa-pseudo-color", pseudoColor);
  }
} 