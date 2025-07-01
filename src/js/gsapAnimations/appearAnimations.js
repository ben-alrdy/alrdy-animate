function createAppearTimeline(element, gsap, duration, ease, delay, distance, animationType) {
  const [_, direction] = animationType.split('-');
  
  // Set initial state based on direction
  const fromState = {
    opacity: 0,
    y: direction === 'up' ? `${3 * distance}rem` : 
       direction === 'down' ? `${-3 * distance}rem` : 0,
    x: direction === 'left' ? `${3 * distance}rem` : 
       direction === 'right' ? `${-3 * distance}rem` : 0,
    duration,
    ease,
    delay
  };
  
  // Create and return timeline
  const tl = gsap.timeline();
  return tl.from(element, fromState);
}

function createRevealTimeline(element, gsap, duration, ease, delay, animationType) {
  const [_, direction] = animationType.split('-');
  
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
      opacity: direction === 'center' ? 0 : 1
    },
    {
      clipPath: clipPaths[direction]?.end || clipPaths.up.end,
      opacity: 1,
      duration,
      ease,
      delay
    }
  );
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
    appear: (element, duration, ease, delay, distance, animationType) => {
      return createAppearTimeline(element, gsap, duration, ease, delay, distance, animationType);
    },
    
    reveal: (element, duration, ease, delay, animationType) => {
      return createRevealTimeline(element, gsap, duration, ease, delay, animationType);
    },
    
    counter: (element, duration, ease, delay, animationType) => {
      return createCounterTimeline(element, gsap, duration, ease, delay, animationType);
    },
  };
}

export { createAppearAnimations }; 