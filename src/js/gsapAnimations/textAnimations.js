export function createTextAnimations(gsap) {
  // Animation defaults - ease and duration won't actually be considered as they are set on the element or default to initOptions
  const defaults = {
    slide:        { duration: 0.5, stagger: 0.1, ease: 'back.out' },
    rotateSoft:   { duration: 1.2, stagger: 0.3, ease: 'circ.out' },
    fade:         { duration: 1.0, stagger: 0.08, ease: 'power2.inOut' },
  };

  // Helper function to create base animation configuration
  function createBaseAnimation(element, splitResult, splitType, duration, stagger, delay, ease) {
    const tl = gsap.timeline();
    
    const baseProps = {
      duration,
      stagger,
      ease,
      delay,
      onStart: () => {
        // Only set visibility in onStart for non-scrubbed animations
        if (!element.hasAttribute('aa-scroll')) {
          gsap.set(element, { visibility: 'visible' });
        }
      }
    };

    // Handle lines&words split type
    if (splitType === 'lines&words') {
      return {
        tl,
        animate: (props) => {
          splitResult.lines.forEach((line, index) => {
            const wordsInLine = splitResult.words.filter(word => line.contains(word));
            tl.from(wordsInLine, {
              ...baseProps,
              ...props
            }, index * stagger * 3);
          });
        }
      };
    }

    // Handle regular split types
    return {
      tl,
      animate: (props) => {
        tl.from(splitResult[splitType], {
          ...baseProps,
          ...props
        });
      }
    };
  }

  // Create animation function with defaults
  function createAnimation(animationProps, defaultValues) {
    return (element, splitResult, splitType, duration, stagger, delay, ease) => {
      
      const { tl, animate } = createBaseAnimation(
        element,
        splitResult,
        splitType,
        duration ?? defaultValues.duration,
        stagger ?? defaultValues.stagger,
        delay,
        ease ?? defaultValues.ease,

      );

      animate(animationProps);
      return tl;
    };
  }

  // Return all animations with their specific configurations
  return {
    fadeUp: createAnimation(
      { y: "150%", x: "-20", opacity: 0 },
      defaults.slide
    ),
    
    slideUp: createAnimation(
      { y: "110%", opacity: 0 },
      defaults.slide
    ),
    
    slideDown: createAnimation(
      { y: "-110%", opacity: 0 },
      defaults.slide
    ),
    
    tiltUp: createAnimation(
      { y: "110%", opacity: 0, rotation: 10, transformOrigin: "bottom left" },
      defaults.slide
    ),
    
    tiltDown: createAnimation(
      { y: "-110%", opacity: 0, rotation: -10, transformOrigin: "top left" },
      defaults.slide
    ),
    
    fadeSoft: createAnimation(
      { opacity: 0.3 },
      defaults.fade
    ),
    
    fade: createAnimation(
      { opacity: 0 },
      defaults.fade
    ),
    
    rotateSoft: (element, splitResult, splitType, duration, stagger, delay, ease) => {
      const tl = gsap.timeline();
      const animationTarget = splitResult[splitType] || splitResult.lines;

      // Calculate perspective
      const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
      const perspectiveInPixels = fontSize * 5;

      // Add perspective wrappers
      animationTarget.forEach(line => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('line-perspective-wrapper');
        line.parentNode.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });

      tl.set('.line-perspective-wrapper', {
        transformStyle: 'preserve-3d',
        perspective: perspectiveInPixels
      })
      .set(animationTarget, {
        transformOrigin: '50% 0%'
      });

      // Animate
      tl.from(animationTarget, {
        autoAlpha: 0,
        rotateX: -90,
        y: '100%',
        scaleX: 0.75,
        duration: duration ?? defaults.rotateSoft.duration,
        stagger: stagger ?? defaults.rotateSoft.stagger,
        ease: ease ?? defaults.rotateSoft.ease,
        delay,
        onStart: () => {
          // Only set autoAlpha in onStart for non-scrubbed animations
          if (!element.hasAttribute('aa-scroll')) {
            gsap.set(element, { visibility: 'visible' });
          }
        }
      });

      return tl;
    }
  };
}