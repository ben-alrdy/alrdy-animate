function createAppearTimeline(element, gsap, duration, ease, delay, distance, animationType, opacity = 1) {
  const [_, direction] = animationType.split('-');

  // Cleanup: clear transform, opacity, and clip-path before setting up animation
  gsap.set(element, { x: 0, y: 0, opacity, clipPath: 'none' });

  // Set initial state based on direction
  const fromState = {
    opacity: 0,
    y: direction === 'up' ? `${3 * distance}rem` : 
       direction === 'down' ? `${-3 * distance}rem` : 0,
    x: direction === 'left' ? `${3 * distance}rem` : 
       direction === 'right' ? `${-3 * distance}rem` : 0
  };

  // Set end state (toState) to visible and no transform
  const toState = {
    opacity,
    y: 0,
    x: 0,
    duration,
    ease,
    delay
  };
  
  // Create and return timeline
  const tl = gsap.timeline();
  return tl.fromTo(element, fromState, toState);
}

function createRevealTimeline(element, gsap, duration, ease, delay, animationType, opacity = 1) {
  const [_, direction] = animationType.split('-');

  // Cleanup: clear transform, opacity, and clip-path before setting up animation
  gsap.set(element, { x: 0, y: 0, opacity, clipPath: 'none' });

  const clipPaths = {
    up: {
      start: 'inset(100% 0 0 0)',
      end: 'inset(0% 0 0 0)'
    },
    down: {
      start: 'inset(0 0 100% 0)',
      end: 'inset(0 0 0% 0)'
    },
    left: {
      start: 'inset(0 100% 0 0)',
      end: 'inset(0 0% 0 0)'
    },
    right: {
      start: 'inset(0 0 0 100%)',
      end: 'inset(0 0 0 0%)'
    },
    center: {
      start: 'circle(0% at 50% 50%)',
      end: 'circle(150% at 50% 50%)'
    }
  };
  
  // Create and return timeline
  const tl = gsap.timeline();
  return tl.fromTo(element, 
    {
      clipPath: clipPaths[direction]?.start || clipPaths.up.start,
      opacity: direction === 'center' ? 0 : opacity
    },
    {
      clipPath: clipPaths[direction]?.end || clipPaths.up.end,
      opacity,
      duration,
      ease,
      delay
    }
  );
}

// Helper to parse aa-color attribute
function parseColorAttribute(attribute) {
  if (!attribute) return {};
  
  return attribute.split(' ').reduce((colors, current) => {
    const [type, value] = current.split(':').map(s => s.trim());
    if (type && value) {
      const colorMap = {
        'bg': 'backgroundColor',
        'text': 'color',
        'border': 'borderColor'
      };
      if (colorMap[type]) {
        colors[colorMap[type]] = value;
      }
    }
    return colors;
  }, {});
}

function createGrowTimeline(element, gsap, duration, ease, delay, animationType) {
  const [_, direction] = animationType.split('-');
  
  // Parse aa-color attribute
  const colorAttr = element.getAttribute('aa-color');
  const targetColors = parseColorAttribute(colorAttr);
  
  // Store original colors
  const computedStyle = window.getComputedStyle(element);
  const originalColors = {};
  if (targetColors.backgroundColor !== undefined) {
    originalColors.backgroundColor = computedStyle.backgroundColor;
  }
  if (targetColors.color !== undefined) {
    originalColors.color = computedStyle.color;
  }
  if (targetColors.borderColor !== undefined) {
    originalColors.borderColor = computedStyle.borderColor;
  }
  
  // Determine which dimension to animate
  const isHorizontal = direction === 'horizontal';
  const property = isHorizontal ? 'width' : 'height';
  
  // Get the natural size (auto)
  const originalSize = element.style[property];
  element.style[property] = 'auto';
  const autoSize = isHorizontal ? element.offsetWidth : element.offsetHeight;
  element.style[property] = originalSize;
  
  // Create initial state
  const fromState = {
    [property]: 0,
    ...targetColors // Start with aa-color values
  };
  
  // Create end state
  const toState = {
    [property]: autoSize,
    ...originalColors, // End with original colors
    duration,
    ease,
    delay
  };
  
  // Cleanup: set initial state
  gsap.set(element, fromState);
  
  // Create and return timeline
  const tl = gsap.timeline();
  return tl.to(element, toState);
}

function createCounterTimeline(element, gsap, duration, ease, delay, animationType) {
  const [_, startValue] = animationType.split('-');
  const originalText = element.textContent;
  
  // Detect format: replace all thousand separators with nothing to get pure number
  const cleanNumber = originalText.replace(/[,\.]/g, '');
  const targetValue = parseFloat(cleanNumber);
  const start = startValue ? parseFloat(startValue) : 0;
  
  // Determine the format (whether using . or , as thousand separator)
  const usesComma = originalText.includes(',');
  const usesDot = originalText.includes('.');
  
  if (isNaN(targetValue)) {
    console.warn('Counter animation target must be a number');
    return gsap.timeline();
  }
  
  // Create and return timeline
  const tl = gsap.timeline();
  return tl.fromTo(element, 
    { 
      textContent: start 
    },
    {
      textContent: targetValue,
      duration,
      ease,
      delay,
      snap: { textContent: 1 },
      onUpdate: function() {
        const value = this.targets()[0].textContent;
        // Format based on original format
        if (usesComma) {
          this.targets()[0].textContent = Number(value).toLocaleString('en-US').replace(/,/g, ',');
        } else if (usesDot) {
          this.targets()[0].textContent = Number(value).toLocaleString('de-DE').replace(/\./g, '.');
        }
      }
    }
  );
}

function createAppearAnimations(gsap, ScrollTrigger) {
  return {
    appear: (element, duration, ease, delay, distance, animationType, opacity = 1) => {
      return createAppearTimeline(element, gsap, duration, ease, delay, distance, animationType, opacity);
    },
    
    reveal: (element, duration, ease, delay, animationType, opacity = 1) => {
      return createRevealTimeline(element, gsap, duration, ease, delay, animationType, opacity);
    },
    
    counter: (element, duration, ease, delay, animationType) => {
      return createCounterTimeline(element, gsap, duration, ease, delay, animationType);
    },
    
    grow: (element, duration, ease, delay, animationType) => {
      return createGrowTimeline(element, gsap, duration, ease, delay, animationType);
    },
  };
}

export { createAppearAnimations }; 