function initializeBackgroundColor(element, gsap, ScrollTrigger, duration, ease, scrollStart, scrollEnd, debug = false, scrub) {
  // Helper function to parse aa-colors attribute
  function parseColors(attribute) {
    if (!attribute) return {};
    
    return attribute.split(';').reduce((colors, current) => {
      const [type, value] = current.split(':').map(s => s.trim());
      if (type === 'bg' || type === 'text') {
        colors[type === 'bg' ? 'backgroundColor' : 'color'] = value;
      }
      return colors;
    }, {});
  }

  // Helper function to check if colors object has valid colors
  function hasValidColors(colors) {
    return Object.keys(colors).length > 0;
  }

  // Helper function to set colors with GSAP
  function setColors(target, colors) {
    if (hasValidColors(colors)) {
      gsap.set(target, colors);
    }
  }

  // Get the wrapper's initial colors from computed styles
  const wrapperStyle = getComputedStyle(element);
  const wrapperInitialColors = {
    backgroundColor: wrapperStyle.backgroundColor,
    color: wrapperStyle.color
  };

  // Get and store all sections with their colors
  const sections = Array.from(element.querySelectorAll('[aa-wrapper-colors]')).map((section, i) => {
    const sectionColors = parseColors(section.getAttribute('aa-wrapper-colors'));
    
    // Get items from children AND the section itself if it has aa-item-colors
    const childItems = Array.from(section.querySelectorAll('[aa-item-colors]')).map(item => {
      const itemColors = parseColors(item.getAttribute('aa-item-colors'));
      
      return {
        element: item,
        colors: itemColors
      };
    });

    // Check if the section itself has aa-item-colors
    const sectionItemColors = parseColors(section.getAttribute('aa-item-colors'));
    let sectionItem = null;
    if (hasValidColors(sectionItemColors)) {
      sectionItem = {
        element: section,
        colors: sectionItemColors
      };
    }

    return {
      element: section,
      colors: sectionColors,
      items: sectionItem ? [sectionItem, ...childItems] : childItems
    };
  });

  // Early return if no sections found
  if (sections.length === 0) return;

  // Check initial scroll position and set appropriate colors
  const checkInitialPosition = () => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const triggerPoint = scrollY + viewportHeight * 0.5;
    
    // Find which section should be active based on current scroll position
    let activeSectionIndex = -1;
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const rect = section.element.getBoundingClientRect();
      const triggerTop = rect.top + scrollY;
      const triggerBottom = rect.bottom + scrollY;
      
      // Check if this section should be active (similar to ScrollTrigger logic)
      if (triggerTop <= triggerPoint && triggerBottom >= triggerPoint) {
        activeSectionIndex = i;
        break; // Found the active section, no need to continue
      }
    }
    
    // Set colors based on active section
    if (activeSectionIndex >= 0) {
      const activeSection = sections[activeSectionIndex];
      setColors(element, activeSection.colors);
      
      // Set item colors for active section
      activeSection.items.forEach(item => {
        setColors(item.element, item.colors);
      });
    } else {
      // No active section, use wrapper initial colors
      setColors(element, wrapperInitialColors);
    }
  };

  // Check initial position after a short delay to ensure DOM is ready
  setTimeout(checkInitialPosition, 100);

  // Create a ScrollTrigger for each section
  sections.forEach((section, index) => {
    const prevSection = index > 0 ? sections[index - 1] : null;
    
    if (scrub) {
      const tl = gsap.timeline({
        defaults: { duration: 1, ease: "none" },
        paused: true,
        data: { index }
      });
      
      // Parent animation - only animate if there are colors to animate to
      if (hasValidColors(section.colors)) {
        const fromColors = prevSection ? {
          backgroundColor: prevSection.colors.backgroundColor,
          color: prevSection.colors.color
        } : wrapperInitialColors;
        
        tl.fromTo(element,
          fromColors,
          section.colors,
          0
        );
      }

      // Item animations
      section.items.forEach(item => {
        if (hasValidColors(item.colors)) {
          tl.to(item.element, {
            backgroundColor: item.colors.backgroundColor,
            color: item.colors.color
          }, "<");
        }
      });

      ScrollTrigger.create({
        trigger: section.element,
        start: scrollStart,
        end: scrollEnd,
        scrub: scrub ? (parseFloat(scrub) || true) : false,
        animation: tl,
        markers: debug,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        preventOverlaps: true
      });

      // Store ScrollTrigger ID for reference
      section.element.dataset.stId = `background-${index}`;
    } else {
      // Create a shared timeline for this section
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration, ease }
      });

      // Set up the forward animation
      if (hasValidColors(section.colors)) {
        tl.to(element, section.colors);
      }

      section.items.forEach(item => {
        if (hasValidColors(item.colors)) {
          tl.to(item.element, {
            ...item.colors
          }, "<");
        }
      });

      ScrollTrigger.create({
        trigger: section.element,
        start: scrollStart,
        onEnter: () => {
          tl.play();
        },
        onLeaveBack: () => {
          tl.reverse();
        },
        markers: debug
      });
    }
  });
}

function initializeParallax(element, gsap, ScrollTrigger, scrub, animationType) {
  // Determine target for animation
  const target = element.querySelector('[aa-parallax-target]') || element;

  // Determine animation direction and property
  const isHorizontal = animationType && animationType.includes('horizontal');
  const prop = isHorizontal ? 'xPercent' : 'yPercent';

  // Get scrub value
  const scrubValue = scrub ? parseFloat(scrub) : true;

  // Get the start position in %
  const startAttr = element.getAttribute('aa-parallax-start');
  const startVal = startAttr !== null ? parseFloat(startAttr) : 10;

  // Get the end position in %
  const endAttr = element.getAttribute('aa-parallax-end');
  const endVal = endAttr !== null ? parseFloat(endAttr) : -10;

  // Get the start/end value of the ScrollTrigger
  const scrollStartRaw = element.getAttribute('aa-scroll-start') || 'top bottom';
  const scrollStart = `clamp(${scrollStartRaw})`;
  
  const scrollEndRaw = element.getAttribute('aa-scroll-end') || 'bottom top';
  const scrollEnd = `clamp(${scrollEndRaw})`;

  // Create GSAP animation with ScrollTrigger
  gsap.fromTo(
    target,
    { [prop]: startVal },
    {
      [prop]: endVal,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: scrollStart,
        end: scrollEnd,
        scrub: scrubValue,
      },
    }
  );
}

function initializeClip(element) {
  const triggers = Array.from(element.querySelectorAll('[aa-clip-trigger]'));
  const contents = Array.from(element.querySelectorAll('[aa-clip-content]'));
  const backgrounds = Array.from(element.querySelectorAll('[aa-clip-background]'));
  const count = contents.length;

  const clipStates = {
    vertical: {
      start: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      end: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      initial: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"
    },
    right: {
      start: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      end: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
      initial: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"
    },
    left: {
      start: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      end: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
      initial: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
    }
  };

  triggers.forEach((trigger, i) => {
    const content = contents[i];
    const background = backgrounds[i];
    if (!content) return;

    content.style.zIndex = count - i;

    const direction = content.getAttribute('aa-clip-content') || 'vertical';
    const state = clipStates[direction];
    const nextContent = contents[i + 1];
    const nextDirection = nextContent ? (nextContent.getAttribute('aa-clip-content') || 'vertical') : null;
    const nextState = nextDirection ? clipStates[nextDirection] : null;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: i === 0 ? "top top" : "top bottom",
        end: i === count - 1 ? "bottom bottom" : "bottom top",
        scrub: true
      },
      defaults: { ease: "none" }
    });

    if (i === 0) {
      gsap.set(content, { clipPath: state.start });
      if (nextDirection === direction) {
        tl.to(content, { clipPath: state.end });
      } else if (nextDirection && nextState) {
        // Animate out using the next section's direction
        tl.to(content, { clipPath: nextState.end });
      }
    } else if (i === count - 1) {
      gsap.set(content, { clipPath: state.initial });
      tl.to(content, { clipPath: state.start });
    } else {
      gsap.set(content, { clipPath: state.initial });
      tl.to(content, { clipPath: state.start });
      if (nextDirection === direction) {
        tl.to(content, { clipPath: state.end });
      } else if (nextDirection && nextState) {
        tl.to(content, { clipPath: nextState.end });
      }
    }

    if (background) {
      gsap.timeline({
        scrollTrigger: {
          trigger: trigger,
          start: "top top",
          end: "bottom top",
          scrub: true
        },
        defaults: { ease: "none" }
      }).to(background, { yPercent: 50 });
    }
  });
}

function initializeStack(element, scrub, distance) {
  const triggers = Array.from(element.querySelectorAll('[aa-stack-trigger]'));
  const contents = Array.from(element.querySelectorAll('[aa-stack-content]'));
  const count = contents.length;

  // Set initial states
  contents.forEach((content, i) => {
    gsap.set(content, {
      opacity: 0,
      zIndex: count - i
    });
  });

  triggers.forEach((trigger, i) => {
    const content = contents[i];
    if (!content) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: "top center",
        end: "bottom center",
        scrub: scrub ? (parseFloat(scrub) || true) : false
      }
    });

    // Create a timeline with three parts:
    // 1. First 10%: Fade in
    // 2. Middle 80%: Stay visible
    // 3. Last 10%: Fade out
    tl.fromTo(content,
      { opacity: 0, yPercent: 10*distance },
      { opacity: 1, yPercent: 0, duration: 0.2 },
      0
    ).to(content,
      { opacity: 1, yPercent: 0, duration: 0.6 },
      0.2
    ).to(content,
      { opacity: 0, yPercent: -10*distance, duration: 0.2 },
      0.8
    );
  });
}

function initializePin(element, scrollStart, scrollEnd, debug = false) {
  // Check if device is touch-enabled - disable pin on touch devices for better UX
  if (ScrollTrigger.isTouch) {
    if (debug) {
      console.log('Pin animation disabled on touch device for better user experience');
    }
    return;
  }

  // Simple pin - just pin the element with specified scroll positions
  const pinType = element.getAttribute('aa-pin-type');
  const config = {
    trigger: element,
    pin: true,
    start: scrollStart,
    end: scrollEnd,
    pinSpacing: false,
    markers: debug,
    invalidateOnRefresh: true
  };
  
  if (pinType) {
    config.pinType = pinType;
  }
  
  ScrollTrigger.create(config);
}

function initializePinStack(element, scrollStart, scrollEnd, debug = false, inAnimation = null, outAnimation = null) {
  // Check if device is touch-enabled - disable pin-stack on touch devices for better UX
  if (ScrollTrigger.isTouch) {
    if (debug) {
      console.log('Pin-stack animation disabled on touch device for better user experience');
    }
    return;
  }

  const children = Array.from(element.children);
  const distance = element.settings.distance;
  
  if (children.length === 0) {
    console.warn('aa-animate="pin-stack": No children found to stack');
    return;
  }
  
  // Get trigger offset for nested animations (how early to trigger before card reaches position)
  const triggerOffset = element.hasAttribute('aa-pin-trigger-animations') 
    ? parseFloat(element.getAttribute('aa-pin-trigger-animations'))
    : 0.7;
  
  // Get gap from CSS (works for both flex and grid)
  const gap = parseFloat(getComputedStyle(element).rowGap) || 0;
  
  // Set all children to overlap using grid positioning
  gsap.set(element, {
    display: 'grid',
    perspective: '1000px' // Set perspective on parent for 3D transforms on children
  });
  
  // Position all children in the same grid cell
  children.forEach(child => {
    gsap.set(child, {
      gridArea: '1 / 1 / 2 / 2'
    });
  });
  
  // Calculate card heights AFTER grid is applied
  const cardHeights = children.map(child => child.offsetHeight);
  
  // Create timeline with scrub AFTER layout is settled
  const pinType = element.getAttribute('aa-pin-type');
  const scrollTriggerConfig = {
    trigger: element,
    start: scrollStart,
    end: scrollEnd,
    scrub: true,
    pin: true,
    pinSpacing: true, // Keep spacing to maintain document flow
    markers: debug,
    invalidateOnRefresh: true
  };
  
  if (pinType) {
    scrollTriggerConfig.pinType = pinType;
  }
  
  const tl = gsap.timeline({
    defaults: {
      ease: "none"
    },
    scrollTrigger: scrollTriggerConfig
  });
  
  // Mark children and their nested aa-animate elements
  children.forEach((child, index) => {
    child.setAttribute('data-pin-stack-card', index);
    
    // Find nested aa-animate elements
    const nestedAnimations = Array.from(child.querySelectorAll('[aa-animate]'));
    
    if (index === 0) {
      // First child: mark nested elements to use pinnedContainer
      nestedAnimations.forEach(nestedEl => {
        nestedEl.setAttribute('aa-pinned-container', element.id || `pin-stack-${Date.now()}`);
      });
      // Ensure pin-stack has an ID for reference
      if (!element.id) {
        element.id = `pin-stack-${Date.now()}`;
      }
    } else {
      // Remaining children: mark nested elements for event-based triggering
      nestedAnimations.forEach(nestedEl => {
        nestedEl.setAttribute('aa-event-trigger', '');
      });
    }
  });
  
  // Apply in-animations (how cards appear from below)
  applyInAnimation(children, cardHeights, gap, tl, inAnimation, distance);
  
  // Apply out-animations (how cards react when next card appears)
  if (outAnimation) {
    applyOutAnimation(children, cardHeights, gap, tl, outAnimation, distance);
  }
  
  // Store timeline and config on element for resize handling
  element.pinStackTimeline = tl;
  element.pinStackConfig = { children, gap, inAnimation, outAnimation, distance, debug, triggerOffset };
  
  // Trigger nested animations when each card becomes active
  // Note: Must be called AFTER storing config since it accesses element.pinStackTimeline
  triggerNestedAnimations(children, tl, triggerOffset, debug);
  
  return tl;
}

// Helper: Restore nested animation state after resize
function restoreNestedAnimationStates(children, currentTime, triggerOffset) {
  children.forEach((child, index) => {
    if (index === 0) return; // First child uses ScrollTriggers
    
    const nestedElements = Array.from(child.querySelectorAll('[aa-animate]'));
    const shouldBeActive = currentTime >= (index - triggerOffset);
    
    nestedElements.forEach(nestedEl => {
      if (shouldBeActive) {
        // Set to completed state (already scrolled past)
        if (nestedEl._delayedCall) nestedEl._delayedCall.kill();
        nestedEl.classList.add('in-view');
        nestedEl.style.visibility = 'visible';
        if (nestedEl.timeline) nestedEl.timeline.progress(1);
      } else {
        // Set to reset state (not yet reached)
        resetNestedAnimation(nestedEl);
      }
    });
  });
}

// Recalculate and update pin-stack on resize
function updatePinStackOnResize(element) {
  if (!element.pinStackTimeline || !element.pinStackConfig) return;
  
  const { children, inAnimation, outAnimation, distance, debug, triggerOffset } = element.pinStackConfig;
  const tl = element.pinStackTimeline;
  const currentTime = tl.time();
  
  // Recalculate dimensions
  const gap = parseFloat(getComputedStyle(element).rowGap) || 0;
  const cardHeights = children.map(child => child.offsetHeight);
  
  
  // Clear and rebuild timeline
  tl.clear();
  delete tl._directionTrackingSetup;
  
  children.forEach(child => {
    gsap.set(child, { gridArea: '1 / 1 / 2 / 2', clearProps: 'y,x,opacity,scale,rotation,rotationX,filter' });
  });
  
  applyInAnimation(children, cardHeights, gap, tl, inAnimation, distance);
  if (outAnimation) applyOutAnimation(children, cardHeights, gap, tl, outAnimation, distance);
  triggerNestedAnimations(children, tl, triggerOffset, debug);
  
  // Restore state
  tl.time(currentTime);
  tl._previousProgress = tl.progress();
  restoreNestedAnimationStates(children, currentTime, triggerOffset);
  
  element.pinStackConfig.gap = gap;
}

// Helper: Setup direction tracking on timeline (only once)
function setupDirectionTracking(timeline) {
  if (timeline._directionTrackingSetup) return;
  
  timeline._previousProgress = timeline._previousProgress ?? timeline.progress();
  
  timeline.eventCallback('onUpdate', () => {
    const curr = timeline.progress();
    timeline._isReversing = curr < timeline._previousProgress;
    timeline._previousProgress = curr;
  });
  
  timeline._directionTrackingSetup = true;
}

// Helper: Activate nested animation via event
function activateNestedAnimation(element, delay) {
  element.dispatchEvent(new CustomEvent('aa-event-trigger', {
    detail: { 
      action: 'play', 
      timeScale: 1, 
      delay: delay || 0 
    }
  }));
}

// Helper: Reset nested animation via event
function resetNestedAnimation(element) {
  element.dispatchEvent(new CustomEvent('aa-event-trigger', {
    detail: { 
      action: 'reverse', 
      timeScale: 1 
    }
  }));
}

// Trigger nested animations when cards become active and reset when scrolling back
function triggerNestedAnimations(children, parentTimeline, triggerOffset, debug) {
  setupDirectionTracking(parentTimeline);
  
  children.forEach((child, index) => {
    if (index === 0) return; // First child uses ScrollTriggers
    
    const nestedElements = Array.from(child.querySelectorAll('[aa-animate]'));
    if (nestedElements.length === 0) return;
    
    // Forward playback callback
    parentTimeline.call(() => {
      if (!parentTimeline._isReversing) {
        nestedElements.forEach(nestedEl => {
          activateNestedAnimation(nestedEl, nestedEl.settings?.delay || 0);
        });
      }
    }, null, index - triggerOffset);
    
    // Reverse playback callback
    parentTimeline.call(() => {
      if (parentTimeline._isReversing) {
        nestedElements.forEach(nestedEl => {
          resetNestedAnimation(nestedEl);
        });
      }
    }, null, index - 1);
  });
}

// Apply in-animation based on type
function applyInAnimation(children, cardHeights, gap, tl, inAnimation, distance) {
  children.forEach((child, index) => {
    const childHeight = cardHeights[index];
    
    // Base Y position (stacked below)
    let baseY = (childHeight + gap) * index;
    
    // Add extra offset for certain animation types
    let extraOffset = 0;
    
    const fromProps = {
      duration: index * 1,
      ease: "none"
    };
    
    // Add animation-specific properties
    switch(inAnimation) {
      case 'fade':
        fromProps.opacity = 0;
        break;
      
      case 'scale':
        gsap.set(child, { transformOrigin: "center center" });
        fromProps.scale = 0.8 * distance;
        break;
      
      case 'rotate':
        gsap.set(child, { transformOrigin: "center center" });
        fromProps.rotation = 15 * (index % 2 === 0 ? 1 : -1);
        extraOffset = childHeight * 0.5 * distance; // Add 50% of card height as extra offset
        break;
      
      // 'simple' or null - just slide up with no extra effects
      default:
        break;
    }
    
    // Set final Y position with any extra offset
    fromProps.y = baseY + extraOffset;
    
    tl.from(child, fromProps, 0);
  });
}

// Apply out-animation based on type
function applyOutAnimation(children, cardHeights, gap, tl, outAnimation, distance) {
  children.forEach((child, index) => {
    // Skip the last card - it has no card appearing after it
    if (index === children.length - 1) return;
    
    // Set transform origin for perspective effects
    if (outAnimation === 'perspective') {
      gsap.set(child, {
        transformOrigin: "top center",
        transformStyle: "preserve-3d"
      });
    }
    
    // Out-animation should start when THIS card reaches its final position
    // and continue as the next cards appear
    const startTime = index; // Card reaches final position at its index
    
    // Duration should cover from when this card is in position until the end
    // This allows the effect to continue as subsequent cards appear
    const remainingCards = children.length - index - 1; // How many cards appear after this one
    const duration = remainingCards; // Animation continues for all remaining cards
    
    const toProps = {
      ease: "none",
    };
    
    switch(outAnimation) {
      case 'perspective':
        // Card tilts back and scales down as subsequent cards appear
        toProps.scale = 0.9 + 0.025 * index;
        toProps.rotationX = -15;
        toProps.y = `${-2 * distance}rem`; // Slight upward movement
        toProps.duration = duration;
        break;

      case 'right':
        toProps.x = `${4 * distance}rem`; // Slight upward movement
        toProps.duration = duration;
        break;

      case 'left':
        toProps.x = `${-4 * distance}rem`; // Slight upward movement
        toProps.duration = duration;
        break;
      
      case 'scale':
        // Card scales down as subsequent cards appear
        toProps.scale = 0.85 * distance;
        toProps.duration = 1;
        break;
      
      case 'blur':
        // Card blurs as subsequent cards appear
        toProps.filter = "blur(8px)";
        toProps.scale = 0.9;
        toProps.y = `${-4 * distance}rem`;
        toProps.duration = 1;
        break;

      case 'fade':
        // Card blurs as subsequent cards appear
        toProps.opacity = 0;
        toProps.duration = 1;
        break;
      
      default:
        return; // No out animation
    }
    
    tl.to(child, toProps, startTime);
  });
}

function createSectionAnimations(gsap, ScrollTrigger) {
  
  return {
    backgroundColor: (element, duration, ease, scrollStart, scrollEnd, debug, scrub) => {
      initializeBackgroundColor(element, gsap, ScrollTrigger, duration, ease, scrollStart, scrollEnd, debug, scrub);
    },
    
    parallax: (element, scrub, animationType) => {
      initializeParallax(element, gsap, ScrollTrigger, scrub, animationType);
    },
    
    clip: (element) => {
      return initializeClip(element);
    },
    
    stack: (element, scrub, distance) => {
      return initializeStack(element, scrub, distance);
    },
    
    pin: (element, scrollStart, scrollEnd, debug) => {
      initializePin(element, scrollStart, scrollEnd, debug);
    },
    
    pinStack: (element, scrollStart, scrollEnd, debug, inAnimation, outAnimation) => {
      return initializePinStack(element, scrollStart, scrollEnd, debug, inAnimation, outAnimation);
    },
    
    updatePinStackOnResize: (element) => {
      updatePinStackOnResize(element);
    }
  };
}

export { createSectionAnimations }; 