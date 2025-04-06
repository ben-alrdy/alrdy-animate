export function getElementSettings(element, settings) {
  // Check if aa-animate contains settings
  const aaAnimate = element.getAttribute('aa-animate');
  const aaHover = element.getAttribute('aa-hover');

  // Check for settings in aa-animate or aa-hover
  if ((aaAnimate && (aaAnimate.includes(':')))  ||
      (aaHover && (aaHover.includes(':'))) ) {
    try {      
      // Parse CSS-like syntax from either attribute
      const parsedSettings = {};
      const settingsString = aaAnimate?.includes(':') || aaAnimate?.startsWith('{') ? 
        aaAnimate : aaHover;

      settingsString.split(';').forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          parsedSettings[key] = !isNaN(value) ? parseFloat(value) : value;
        }
      });
      
      return {
        ...settings,
        ...parsedSettings,
        animationType: aaAnimate && !aaAnimate.includes(':') ? aaAnimate : parsedSettings.animationType,
        hoverType: aaHover && !aaHover.includes(':') ? aaHover : parsedSettings.hoverType,
        anchorSelector: parsedSettings.anchorSelector || null,
        anchorElement: parsedSettings.anchorSelector ? document.querySelector(parsedSettings.anchorSelector) : element,
        isReverse: parsedSettings.hoverType ? parsedSettings.hoverType.includes('reverse') : false,
        bg: element.querySelector('[aa-hover-bg]')
      };
    } catch (e) {
      console.warn('Invalid settings format:', e);
    }
  }

  const animationType = element.getAttribute('aa-animate');
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