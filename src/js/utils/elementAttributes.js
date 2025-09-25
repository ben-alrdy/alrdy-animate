// Parse direction from hover type (e.g., "bg-circle-vertical" -> "vertical")
function parseHoverDirection(hoverType) {
  if (!hoverType) return null;
  
  // Handle multiple hover types separated by &
  const types = hoverType.split('&');
  
  for (const type of types) {
    // Only parse direction for background animations
    if (type.startsWith('bg-')) {
      const parts = type.split('-');
      
      // For bg-[type]-[direction] format
      if (parts.length >= 3) {
        const direction = parts.slice(2).join('-'); // Handle multi-part directions like "up-right"
        
        // Valid direction values
        const validDirections = [
          'all', 'vertical', 'horizontal', 'top', 'bottom', 'left', 'right',
          'up', 'down', 'up-right', 'up-left', 'down-right', 'down-left'
        ];
        
        if (validDirections.includes(direction)) {
          return direction;
        }
      }
    }
  }
  
  return null;
}

export function getElementSettings(element, settings, isMobile) {
  // Parse attributes with mobile/desktop variants (desktop|mobile)
  function parseResponsiveAttribute(attribute, defaultValue) {
    if (!attribute) return defaultValue;
    
    if (attribute.includes('|')) {
      const [desktop, mobile] = attribute.split('|');
      return isMobile ? mobile.trim() : desktop.trim();
    }
    
    return attribute.trim();
  }

  // Handle mobile animations
  const originalAnimationType = element.getAttribute('aa-animate-original') || element.getAttribute('aa-animate');
  let animationType = originalAnimationType;
  
  if (originalAnimationType && originalAnimationType.includes('|')) {
    // Store original value if not already stored
    if (!element.hasAttribute('aa-animate-original')) {
      element.setAttribute('aa-animate-original', originalAnimationType);
    }
    
    // Use the responsive parsing function
    animationType = parseResponsiveAttribute(originalAnimationType, null);
    // Update the actual attribute for CSS animations
    element.setAttribute('aa-animate', animationType);
  }

  const hoverType = element.getAttribute('aa-hover');
  
  // Handle mobile slider variants
  const sliderType = parseResponsiveAttribute(element.getAttribute('aa-slider'), null);
  
  // Handle accordion type
  const accordionType = parseResponsiveAttribute(element.getAttribute('aa-accordion'), null);
  
  // Handle marquee type
  const marqueeType = parseResponsiveAttribute(element.getAttribute('aa-marquee'), null);
  
  const anchorSelector = element.getAttribute("aa-anchor");
  const anchorElement = anchorSelector ? document.querySelector(anchorSelector) : element;
  const color = animationType?.includes('#') ? '#' + animationType.split('#')[1] : undefined;

  // Get scroll start/end values
  const scrollStart = parseResponsiveAttribute(element.getAttribute('aa-scroll-start'),settings.scrollStart || 'top 80%');
  
  const scrollEnd = parseResponsiveAttribute(element.getAttribute('aa-scroll-end'), settings.scrollEnd || 'bottom 70%');

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
    hoverDirection: hoverType ? (parseHoverDirection(hoverType) || element.getAttribute('aa-hover-direction') || 'all') : 'all',
    isReverse: hoverType ? hoverType.includes('reverse') : false,
    hoverDuration: element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : settings.hoverDuration,
    hoverDelay: element.hasAttribute('aa-delay') ? parseFloat(element.getAttribute('aa-delay')) : settings.hoverDelay,
    hoverEase: element.hasAttribute('aa-ease') ? element.getAttribute('aa-ease') : settings.hoverEase,
    hoverDistance: element.hasAttribute('aa-distance') ? parseFloat(element.getAttribute('aa-distance')) : settings.hoverDistance,
    hoverStagger: element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : 0.03,
    bg: element.querySelector('[aa-hover-bg]'),

    // Slider properties
    sliderType,
    
    // Accordion properties
    accordionType,
    
    // Marquee properties
    marqueeType,

    // Animation timing
    duration: element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : settings.duration,
    delay: element.hasAttribute('aa-delay') ? parseFloat(element.getAttribute('aa-delay')) : settings.delay,
    delayMobile: element.hasAttribute('aa-delay-mobile') ? parseFloat(element.getAttribute('aa-delay-mobile')) : undefined,
    stagger: element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : undefined,
    opacity: element.hasAttribute('aa-opacity') ? parseFloat(element.getAttribute('aa-opacity')) : 1,
    
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
  const { duration, delay, distance, delayMobile, color, opacity } = elementSettings;

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

  // Set opacity if specified on element
  if (element.hasAttribute('aa-opacity')) {
    element.style.setProperty("--aa-opacity", `${opacity}`);
  }

  if (element.getAttribute('aa-animate')?.includes('#')) {
    element.style.setProperty("--aa-pseudo-color", color);
  }
} 