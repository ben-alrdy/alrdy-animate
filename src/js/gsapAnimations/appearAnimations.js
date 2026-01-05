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
  // Extract direction, handling multi-part directions like "oval-up"
  const parts = animationType.split('-');
  const direction = parts.length > 2 ? `${parts[1]}-${parts[2]}` : parts[1];

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
    right: {
      start: 'inset(0 100% 0 0)',
      end: 'inset(0 0% 0 0)'
    },
    left: {
      start: 'inset(0 0 0 100%)',
      end: 'inset(0 0 0 0%)'
    },
    center: {
      start: 'circle(0% at 50% 50%)',
      end: 'circle(150% at 50% 50%)'
    },
    'oval-down': {
      start: 'ellipse(0% 0% at 50% 0%)',
      end: 'ellipse(150% 150% at 50% 0%)'
    },
    'oval-up': {
      start: 'ellipse(0% 0% at 50% 100%)',
      end: 'ellipse(150% 150% at 50% 100%)'
    },
    'oval-right': {
      start: 'ellipse(0% 0% at 0% 50%)',
      end: 'ellipse(150% 150% at 0% 50%)'
    },
    'oval-left': {
      start: 'ellipse(0% 0% at 100% 50%)',
      end: 'ellipse(150% 150% at 100% 50%)'
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


function createGrowTimeline(element, gsap, duration, ease, delay, animationType) {
  const [_, direction] = animationType.split('-');
  
  // Parse aa-color attribute
  const targetColors = element.settings?.colors || {};
  
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
  
  // Create initial state
  const fromState = {
    [property]: 0,
    ...targetColors // Start with aa-color values
  };
  
  // Create end state - GSAP handles 'auto' value properly without forced reflow
  const toState = {
    [property]: 'auto',
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

// Clip-path configurations - defined outside function to avoid recreation
const SLICE_CLIP_PATHS = {
  up: { start: 'inset(100% 0 0 0)', end: 'inset(0% 0 0 0)' },
  down: { start: 'inset(0 0 100% 0)', end: 'inset(0 0 0% 0)' },
  left: { start: 'inset(0 100% 0 0)', end: 'inset(0 0% 0 0)' },
  right: { start: 'inset(0 0 0 100%)', end: 'inset(0 0 0 0%)' }
};

function createRevealSlicesTimeline(element, gsap, duration, ease, delay, animationType, opacity, stagger, distance) {
  // Parse direction and slice count from animationType
  // Examples: reveal-slices, reveal-slices-up, reveal-slices-down-7, reveal-slices-left-10
  const parts = animationType.split('-');
  let sliceCount = 5; // default
  let direction = 'up'; // default direction
  
  // Find direction (up, down, left, right)
  const directions = ['up', 'down', 'left', 'right'];
  const foundDirection = parts.find(part => directions.includes(part));
  if (foundDirection) {
    direction = foundDirection;
  }
  
  // Find slice count (number after direction, or after 'slices' if no direction)
  const directionIndex = foundDirection ? parts.indexOf(foundDirection) : -1;
  if (directionIndex >= 0 && directionIndex + 1 < parts.length) {
    const count = parseInt(parts[directionIndex + 1], 10);
    if (!isNaN(count) && count > 0) {
      sliceCount = count;
    }
  } else if (!foundDirection && parts.length >= 3 && parts[1] === 'slices') {
    const count = parseInt(parts[2], 10);
    if (!isNaN(count) && count > 0) {
      sliceCount = count;
    }
  }
  
  // Determine if vertical or horizontal slicing
  const isVertical = direction === 'up' || direction === 'down';
  
  // Batch read dimensions BEFORE any DOM writes to avoid forced reflow
  const elementHeight = element.offsetHeight;
  const elementWidth = element.offsetWidth;
  const originalContent = Array.from(element.childNodes);
  
  // Store original content for efficient restoration during cleanup
  // These nodes will be detached when we clear innerHTML, but references remain valid
  element._revealSlicesOriginalContent = originalContent;
  
  // Cleanup: clear transform, opacity, and clip-path before setting up animation
  gsap.set(element, { x: 0, y: 0, opacity, clipPath: 'none' });
  
  // Calculate slice sizes based on distance (height for vertical, width for horizontal)
  // When distance === 1: all slices equal size
  // When distance > 1: linear interpolation from 1 to distance
  // When distance < 1: linear interpolation from 1 to distance
  const sliceSizes = [];
  if (sliceCount === 1) {
    // Single slice takes full size
    sliceSizes.push(1);
  } else if (distance === 1) {
    // All slices have equal size
    const equalSize = 1 / sliceCount;
    for (let i = 0; i < sliceCount; i++) {
      sliceSizes.push(equalSize);
    }
  } else {
    // Linear interpolation
    for (let i = 0; i < sliceCount; i++) {
      const t = i / (sliceCount - 1); // 0 to 1
      const size = 1 + (distance - 1) * t; // Interpolate from 1 to distance
      sliceSizes.push(size);
    }
    // Normalize so total size equals 1
    const totalSize = sliceSizes.reduce((sum, s) => sum + s, 0);
    for (let i = 0; i < sliceSizes.length; i++) {
      sliceSizes[i] = sliceSizes[i] / totalSize;
    }
  }
  
  // Create container for slices with all styles at once
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  });
  
  // Clear element and add container in one operation
  element.innerHTML = '';
  element.appendChild(container);
  
  // Calculate exact pixel sizes for each slice to avoid sub-pixel gaps
  const slicePixelSizes = [];
  const dimension = isVertical ? elementHeight : elementWidth;
  let totalCalculatedSize = 0;
  
  // First, calculate sizes in pixels (rounding down to avoid overflow)
  for (let i = 0; i < sliceCount; i++) {
    const pixelSize = Math.floor(sliceSizes[i] * dimension);
    slicePixelSizes.push(pixelSize);
    totalCalculatedSize += pixelSize;
  }
  
  // Adjust the last slice to account for any rounding differences
  // This ensures slices add up exactly to dimension without gaps
  if (slicePixelSizes.length > 0 && totalCalculatedSize < dimension) {
    slicePixelSizes[slicePixelSizes.length - 1] += (dimension - totalCalculatedSize);
  }
  
  // Get clip-path config (moved outside function for performance)
  const clipPathConfig = SLICE_CLIP_PATHS[direction];
  
  // Create slices - batch DOM operations
  const slices = [];
  const fragment = document.createDocumentFragment(); // Batch append to container
  let currentPositionPx = 0;
  
  for (let i = 0; i < sliceCount; i++) {
    const slice = document.createElement('div');
    const sliceContent = document.createElement('div');
    const hasOverlap = i > 0;
    const positionPx = hasOverlap ? currentPositionPx - 1 : currentPositionPx;
    const sizePx = slicePixelSizes[i] + (hasOverlap ? 1 : 0);
    
    // Set slice styles in one operation
    if (isVertical) {
      Object.assign(slice.style, {
        position: 'absolute',
        left: '0',
        right: '0',
        width: '100%',
        height: `${sizePx}px`,
        top: `${positionPx}px`,
        overflow: 'hidden'
      });
      sliceContent.style.transform = `translateY(-${positionPx}px)`;
    } else {
      Object.assign(slice.style, {
        position: 'absolute',
        top: '0',
        bottom: '0',
        height: '100%',
        width: `${sizePx}px`,
        left: `${positionPx}px`,
        overflow: 'hidden'
      });
      sliceContent.style.transform = `translateX(-${positionPx}px)`;
    }
    
    // Set sliceContent styles in one operation
    Object.assign(sliceContent.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: `${elementWidth}px`,
      height: `${elementHeight}px`
    });
    
    // Clone content for this slice (unavoidable for independent clipping)
    // Use DocumentFragment for efficient DOM manipulation
    const contentFragment = document.createDocumentFragment();
    originalContent.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
        contentFragment.appendChild(node.cloneNode(true));
      }
    });
    sliceContent.appendChild(contentFragment);
    
    slice.appendChild(sliceContent);
    fragment.appendChild(slice); // Batch append
    slices.push(slice);
    
    currentPositionPx += slicePixelSizes[i];
  }
  
  // Append all slices at once to reduce reflows
  container.appendChild(fragment);
  
  // Create timeline
  const tl = gsap.timeline();
  const shouldReverseStagger = direction === 'right';
  
  // Batch set initial states for all slices (GSAP can handle array of targets)
  gsap.set(slices, {
    clipPath: clipPathConfig.start,
    opacity: opacity
  });
  
  // Animate each slice with stagger
  slices.forEach((slice, index) => {
    const staggerIndex = shouldReverseStagger ? (sliceCount - 1 - index) : index;
    
    tl.to(slice, {
      clipPath: clipPathConfig.end,
      duration,
      ease,
      delay: staggerIndex === 0 ? delay : 0 // Only apply base delay to first slice in stagger order
    }, staggerIndex * stagger);
  });
  
  // Store container reference for cleanup if needed
  element._revealSlicesContainer = container;
  
  return tl;
}

function cleanupRevealSlices(element, gsap) {
  if (!element._revealSlicesContainer) {
    return; // Already cleaned up or never initialized
  }
  
  // Kill timeline if it exists
  if (element.timeline) {
    element.timeline.kill();
    element.timeline = null;
  }
  
  // Kill all tweens on slice elements
  const slices = element._revealSlicesContainer.querySelectorAll('div[style*="position: absolute"]');
  if (slices.length > 0) {
    gsap.killTweensOf(slices);
  }
  
  // Remove the container from DOM
  if (element._revealSlicesContainer.parentNode === element) {
    element.removeChild(element._revealSlicesContainer);
  }
  
  // Restore original content directly from stored references (most efficient)
  // The nodes were detached when we cleared innerHTML, but references are still valid
  const originalContent = element._revealSlicesOriginalContent;
  if (originalContent && originalContent.length > 0) {
    const fragment = document.createDocumentFragment();
    originalContent.forEach(node => {
      // Nodes are detached but still valid - re-append them directly
      fragment.appendChild(node);
    });
    element.appendChild(fragment);
  }
  
  // Clear GSAP properties from the element
  gsap.set(element, { clearProps: "all" });
  
  // Clear references
  element._revealSlicesContainer = null;
  element._revealSlicesOriginalContent = null;
}

function createAppearAnimations(gsap, ScrollTrigger) {
  return {
    appear: (element, duration, ease, delay, distance, animationType, opacity = 1) => {
      return createAppearTimeline(element, gsap, duration, ease, delay, distance, animationType, opacity);
    },
    
    reveal: (element, duration, ease, delay, animationType, opacity = 1) => {
      return createRevealTimeline(element, gsap, duration, ease, delay, animationType, opacity);
    },
    
    revealSlices: (element, duration, ease, delay, animationType, opacity = 1, stagger = 0.02, distance = 3) => {
      return createRevealSlicesTimeline(element, gsap, duration, ease, delay, animationType, opacity, stagger, distance);
    },
    
    cleanupRevealSlices: (element) => {
      return cleanupRevealSlices(element, gsap);
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