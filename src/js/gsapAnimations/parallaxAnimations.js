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

function initializeGlide(element, gsap, ScrollTrigger, dampingFactor, glideMultiplier, debug = false) {
  // Mobile check - disable below 1080px
  if (window.innerWidth < 1080) {
    if (debug) {
      console.log('Glide animation disabled on mobile for better performance');
    }
    return;
  }
  
  // Use provided damping factor (from aa-delay) or default to 0.9
  const damping = dampingFactor || 0.9;
  
  // Calculate max displacement (10% of viewport height)
  let maxDisplacement = window.innerHeight * 0.1;
  
  // Per-element state - mimics StringGlide's internal state
  const state = {
    previousScroll: window.pageYOffset || document.documentElement.scrollTop,
    displacement: 0,
    acceleration: 0,
    velocityMultiplier: 1,
    previousVelocitySign: 0,
    isActive: false
  };
  
  // Store state on element for cleanup
  element._glideState = state;
  
  // Constants matching StringGlide behavior
  const accelerationGrowth = 0.1;
  const accelerationCap = 1;
  const displacementMin = 0.01;
  const displacementMax = 3;
  
  // Frame-based update function (runs every frame, not just on scroll)
  // This is optimal: capped at 60fps by gsap.ticker, reads then writes (no forced reflow)
  const updateGlide = () => {
    if (!state.isActive) return;
    
    // Get current scroll position (read operation)
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const scrollDelta = currentScroll - state.previousScroll;
    state.previousScroll = currentScroll;
    
    // Normalize scroll delta to velocity-like value
    const velocity = scrollDelta * -0.01; // Reversed direction
    
    // Detect direction changes - give stronger push on direction change
    const currentSign = Math.sign(velocity);
    if (currentSign !== 0 && state.previousVelocitySign !== 0 && currentSign !== state.previousVelocitySign) {
      // Direction changed - stronger multiplier
      state.velocityMultiplier = 1.5;
    } else {
      // Gradually reduce multiplier
      state.velocityMultiplier = Math.max(1, state.velocityMultiplier * 0.95);
    }
    state.previousVelocitySign = currentSign;
    
    // Update acceleration based on velocity magnitude
    const adjustedVelocity = velocity * state.velocityMultiplier;
    state.acceleration = Math.min(accelerationCap, state.acceleration + Math.abs(adjustedVelocity) * accelerationGrowth);
    
    // Integrate velocity into displacement (this creates the accumulation effect)
    state.displacement += adjustedVelocity * state.acceleration;
    
    // Apply damping to create smooth decay (this runs every frame!)
    state.displacement *= damping;
    
    // Clamp displacement to bounds
    state.displacement = Math.max(-displacementMax, Math.min(displacementMax, state.displacement));
    
    // Apply minimum threshold to snap to zero
    if (Math.abs(state.displacement) < displacementMin) {
      state.displacement = 0;
    }
    
    // Calculate final pixel offset
    const pixelOffset = state.displacement * maxDisplacement * glideMultiplier;
    
    // Apply transform (GPU-accelerated, batched by GSAP)
    gsap.set(element, { y: pixelOffset });
  };
  
  // Use gsap.ticker for smooth 60fps updates
  gsap.ticker.add(updateGlide);
  
  // Create ScrollTrigger to manage active state
  // Keep active as long as element is anywhere in viewport (with some buffer)
  const trigger = ScrollTrigger.create({
    trigger: element,
    start: 'top bottom+=10%',
    end: 'bottom top-=10%',
    onToggle: (self) => {
      state.isActive = self.isActive;
      
      // Reset when leaving viewport
      if (!self.isActive) {
        gsap.to(element, {
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => {
            state.acceleration = 0;
            state.displacement = 0;
          }
        });
      } else {
        // Reset scroll tracking when entering
        state.previousScroll = window.pageYOffset || document.documentElement.scrollTop;
      }
    },
    markers: debug
  });
  
  // Handle resize - recalculate max displacement
  const handleResize = () => {
    maxDisplacement = window.innerHeight * 0.1;
  };
  
  window.addEventListener('resize', handleResize);
  
  // Store cleanup function
  element._glideCleanup = () => {
    gsap.ticker.remove(updateGlide);
    window.removeEventListener('resize', handleResize);
    if (trigger) {
      trigger.kill();
    }
  };
}

function createParallaxAnimations(gsap, ScrollTrigger) {
  return {
    parallax: (element, scrub, animationType) => {
      initializeParallax(element, gsap, ScrollTrigger, scrub, animationType);
    },
    
    glide: (element, dampingFactor, glideMultiplier, debug) => {
      initializeGlide(element, gsap, ScrollTrigger, dampingFactor, glideMultiplier, debug);
    }
  };
}

export { createParallaxAnimations };

