export function getElementSettings(element, settings, isMobile) {
  // Handle mobile animations
  let animationType = element.getAttribute('aa-animate-original') || element.getAttribute('aa-animate');
  if (animationType && animationType.includes('|')) {
    // Store original value if not already stored
    if (!element.hasAttribute('aa-animate-original')) {
      element.setAttribute('aa-animate-original', animationType);
    }
    
    const [desktopAnim, mobileAnim] = animationType.split('|');
    animationType = isMobile ? mobileAnim : desktopAnim;
    // Update the actual attribute for CSS animations
    element.setAttribute('aa-animate', animationType);
  }

  const hoverType = element.getAttribute('aa-hover');
  const anchorSelector = element.getAttribute("aa-anchor");
  const anchorElement = anchorSelector ? document.querySelector(anchorSelector) : element;
  const color = animationType?.includes('#') ? '#' + animationType.split('#')[1] : undefined;

  // Parse scroll start/end attributes with mobile support
  function parseScrollAttribute(attribute, defaultValue) {
    if (!attribute) return defaultValue;
    
    if (attribute.includes('|')) {
      const [desktop, mobile] = attribute.split('|');
      return isMobile ? mobile.trim() : desktop.trim();
    }
    
    return attribute.trim();
  }

  // Get scroll start/end values
  const scrollStart = parseScrollAttribute(element.getAttribute('aa-scroll-start'),settings.scrollStart || 'top 80%');
  
  const scrollEnd = parseScrollAttribute(element.getAttribute('aa-scroll-end'), settings.scrollEnd || 'bottom 70%');

  // Backward compatibility: convert aa-viewport to aa-scroll-start format
  let finalScrollStart = scrollStart;
  if (element.hasAttribute('aa-viewport') && !element.hasAttribute('aa-scroll-start')) {
    const viewport = parseFloat(element.getAttribute('aa-viewport'));
    finalScrollStart = `top ${viewport * 100}%`;
  }

  return {
    // Animation properties
    animationType,
    ease: element.hasAttribute('aa-ease') ? element.getAttribute('aa-ease') : settings.ease,
    split: element.getAttribute('aa-split'),
    scrub: element.getAttribute('aa-scrub'),
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
    color,
    
    // Scroll positioning (new system)
    scrollStart: finalScrollStart,
    scrollEnd: scrollEnd,
    
    // Anchoring
    anchorSelector,
    anchorElement,
    
    // Parent-specific attributes
    isParent: element.hasAttribute("aa-children"),
    childrenAnimation: element.getAttribute("aa-children")
  };
}

export function applyElementStyles(element, elementSettings, isMobile) {
  const { duration, delay, distance, delayMobile, color } = elementSettings;

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
    element.style.setProperty("--aa-pseudo-color", color);
  }
} 