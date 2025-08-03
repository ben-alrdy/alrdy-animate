function createMarqueeTimeline(element, gsap, duration, scrub, animationType) {
  // Parse animation settings from aa-animate attribute
  const isRightDirection = animationType.includes('right');
  const hasHover = animationType.includes('hover');
  const isPaused = animationType.includes('paused');
  const hasSwitch = animationType.includes('switch');

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

  const baseDirection = isRightDirection ? -1 : 1; 
  let currentDirection = baseDirection;

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
      xPercent: isRightDirection ? 100 : -100,
      force3D: true,
      willChange: 'transform'
    });

    // Set the direction using timeScale
    animation.play();
    animation.timeScale(currentDirection);

    element.classList.add('marquee-normal');

    // Only set up direction switching if needed
    if (hasSwitch) {
      let lastDirection = currentDirection;

      // Watch for scroll direction changes
      const observer = new MutationObserver((mutations) => {

        const hasScrollDirectionChange = mutations.some(mutation => 
          mutation.attributeName === 'data-scroll-direction'
        );
        
        if (hasScrollDirectionChange) {
          // Update marquee direction based on scroll direction
          const scrollDirection = document.body.getAttribute('data-scroll-direction') || 'down';
          const isInverted = scrollDirection === 'up';
          const newDirection = isInverted ? -baseDirection : baseDirection;

          if (newDirection !== lastDirection) {
            lastDirection = newDirection;
            currentDirection = newDirection; 
            animation.timeScale(newDirection);
          }

          element.classList.toggle('marquee-normal', !isInverted);
          element.classList.toggle('marquee-inverted', isInverted);
        }
      });

      observer.observe(document.body, { 
        attributes: true,
        attributeFilter: ['data-scroll-direction']
      });
    }

    // Only add hover listeners if hover is enabled
    if (hasHover) {
      element.addEventListener('mouseenter', () => {
        // Smoothly slow down animation on hover
        gsap.to(animation, {
          timeScale: currentDirection * 0.25,
          duration: 0.3,
          ease: "power2.out"
        });
      });

      element.addEventListener('mouseleave', () => {
        // Smoothly restore normal speed
        gsap.to(animation, {
          timeScale: currentDirection,
          duration: 0.3,
          ease: "power2.out"
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

    const scrollStart = isRightDirection ? -scrollSpeed : scrollSpeed;
    scrollTl.fromTo(scrollContainer,
      { x: `${scrollStart}vw` },
      { x: `${-scrollStart}vw`, ease: 'none' }
    );
  }
}

function createMarqueeAnimations(gsap, ScrollTrigger) {
  return {
    marquee: (element, duration, scrub, animationType) => {
      return createMarqueeTimeline(element, gsap, duration, scrub, animationType);
    },
  };
}

export { createMarqueeAnimations }; 