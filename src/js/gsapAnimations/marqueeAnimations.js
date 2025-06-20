function createMarqueeTimeline(element, gsap, duration, scrub) {
  // Parse animation settings from aa-animate attribute
  const animateAttr = element.getAttribute('aa-animate');
  const isRightDirection = animateAttr.includes('right');
  const hasHover = animateAttr.includes('hover');
  const isPaused = animateAttr.includes('paused');
  const hasSwitch = animateAttr.includes('switch');
  
  const scrollContainer = element.querySelector('[aa-marquee-scroller]');
  const collection = element.querySelector('[aa-marquee-items]');
  
  if (!scrollContainer || !collection) {
    console.warn('Marquee elements not found. Required: [aa-marquee-scroller] and [aa-marquee-items]');
    return;
  }

  const speedMultiplier = window.innerWidth < 479 ? 0.5 : window.innerWidth < 991 ? 0.75 : 1;
  const scrollSpeed = parseInt(scrollContainer.getAttribute('aa-marquee-scroller')) || 0;
  const baseSpeed = duration * (collection.offsetWidth / window.innerWidth) * speedMultiplier;
  
  const duplicates = parseInt(collection.getAttribute('aa-marquee-items')) || 2;

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < duplicates; i++) {
    fragment.appendChild(collection.cloneNode(true));
  }
  scrollContainer.appendChild(fragment);

  const marqueeItems = element.querySelectorAll('[aa-marquee-items]');
  const directionMultiplier = isRightDirection ? 1 : -1;
  
  // Only create continuous marquee animation if not paused
  if (!isPaused) {
    // Create animation first (always to -100)
    const animation = gsap.to(marqueeItems, {
      xPercent: -100,
      repeat: -1,
      duration: baseSpeed,
      ease: 'linear',
      force3D: true, // Enable hardware acceleration
      willChange: 'transform' // Hint to browser about animation
    }).totalProgress(0.5);

    // Set initial position based on direction
    gsap.set(marqueeItems, { 
      xPercent: directionMultiplier === 1 ? 100 : -100,
      force3D: true,
      willChange: 'transform'
    });
    
    // Control direction with timeScale
    animation.timeScale(directionMultiplier);
    animation.play();

    // Set initial state using class
    element.classList.add('marquee-normal');

    // Only set up direction switching if needed
    if (hasSwitch) {
      // State variables for direction changes
      let isChangingDirection = false;
      let lastDirection = directionMultiplier;
      let currentDirection = directionMultiplier;
      let lastScrollTime = 0;
      const scrollThrottle = 100; // Throttle scroll events to every 100ms

      // Watch for scroll direction changes
      const observer = new MutationObserver((mutations) => {
        const now = Date.now();
        if (now - lastScrollTime < scrollThrottle) return;
        lastScrollTime = now;

        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-scroll-direction') {
            const direction = document.body.getAttribute('data-scroll-direction');
            const isInverted = direction === 'down';
            
            // Update marquee direction based on scroll direction
            currentDirection = isInverted ? -directionMultiplier : directionMultiplier;
            
            if (!isChangingDirection && currentDirection !== lastDirection) {
              isChangingDirection = true;
              lastDirection = currentDirection;

              // Use a single animation for smoother transition
              gsap.to(animation, {
                timeScale: currentDirection,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                  isChangingDirection = false;
                }
              });
            }
            
            element.classList.toggle('marquee-normal', !isInverted);
            element.classList.toggle('marquee-inverted', isInverted);
          }
        });
      });

      observer.observe(document.body, { attributes: true });
    }

    // Only add hover listeners if hover is enabled
    if (hasHover) {
      element.addEventListener('mouseenter', () => {
        gsap.to(animation, {
          timeScale: currentDirection / 4,
          duration: 0.5
        });
      });

      element.addEventListener('mouseleave', () => {
        gsap.to(animation, {
          timeScale: currentDirection,
          duration: 0.5
        });
      });
    }
  }

  // Only create scroll effect if scrollSpeed > 0
  if (scrollSpeed > 0) {
    scrollContainer.style.marginLeft = `-${scrollSpeed}%`;
    scrollContainer.style.width = `${(scrollSpeed * 2) + 100}%`;
    
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: '0% 100%',
        end: '100% 0%',
        scrub: scrub ? (parseFloat(scrub) || true) : false
      }
    });

    const scrollStart = directionMultiplier === -1 ? scrollSpeed : -scrollSpeed;
    scrollTl.fromTo(scrollContainer, 
      { x: `${scrollStart}vw` }, 
      { x: `${-scrollStart}vw`, ease: 'none' }
    );
  }
}

function createMarqueeAnimations(gsap, ScrollTrigger) {
  return {
    marquee: (element, duration, scrub) => {
      return createMarqueeTimeline(element, gsap, duration, scrub);
    },
  };
}

export { createMarqueeAnimations }; 