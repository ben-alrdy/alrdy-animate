export function createTextAnimations(gsap) {
  // Animation defaults
  const defaults = {
    slide:        { duration: 0.5, stagger: 0.1, ease: 'back.out' },
    rotateSoft:   { duration: 1.2, stagger: 0.3, ease: 'circ.out' },
    fade:         { duration: 1.0, stagger: 0.08, ease: 'power2.inOut' },
    blur:         { duration: 0.4, stagger: 0.02, ease: 'ease-out' },
  };

  // Helper function to create base animation configuration
  function createBaseAnimation(element, splitElements, split, duration, stagger, delay, ease) {
    const tl = gsap.timeline();
    
    const baseProps = {
      duration,
      stagger,
      ease,
      delay,
      onStart: () => {
        // Only set visibility in onStart for non-scrubbed animations
        if (!element.hasAttribute('aa-scrub')) {
          gsap.set(element, { visibility: 'visible' });
        }
      }
    };

    // Handle lines&words split type
    if (split === 'lines&words') {
      return {
        tl,
        animate: (props) => {
          splitElements.lines.forEach((line, index) => {
            const wordsInLine = splitElements.words.filter(word => line.contains(word));
            tl.from(wordsInLine, {
              ...baseProps,
              ...props
            }, index * stagger * 3);
          });
        }
      };
    }

    // Handle lines&chars split type
    if (split === 'lines&chars') {
      return {
        tl,
        animate: (props) => {
          splitElements.lines.forEach((line, index) => {
            const charsInLine = splitElements.chars.filter(char => line.contains(char));
            tl.from(charsInLine, {
              ...baseProps,
              ...props
            }, index * stagger * 6);
          });
        }
      };
    }

    // Handle regular split types
    return {
      tl,
      animate: (props) => {
        tl.from(splitElements[split], {
          ...baseProps,
          ...props
        });
      }
    };
  }

  // Create animation function with defaults
  function createAnimation(animationProps, defaultValues) {
    return (element, splitElements, split, duration, stagger, delay, ease) => {
      const { tl, animate } = createBaseAnimation(
        element,
        splitElements,
        split,
        duration ?? defaultValues.duration,
        stagger ?? defaultValues.stagger,
        delay,
        ease ?? defaultValues.ease
      );

      animate(animationProps);
      return tl;
    };
  }

  // Define all text animations in one place
  const textAnimations = {
    'text-slide-up': createAnimation(
      { y: "110%", opacity: 0 },
      defaults.slide
    ),
    
    'text-slide-down': createAnimation(
      { y: "-110%", opacity: 0 },
      defaults.slide
    ),
    
    'text-slide-left': createAnimation(
      { x: "100vw", opacity: 0 },
      defaults.slide
    ),
    
    'text-tilt-up': createAnimation(
      { y: "110%", opacity: 0, rotation: 10, transformOrigin: "bottom left" },
      defaults.slide
    ),
    
    'text-tilt-down': createAnimation(
      { y: "-110%", opacity: 0, rotation: -10, transformOrigin: "top left" },
      defaults.slide
    ),

    'text-fade-up': createAnimation(
      { y: "150%", x: "-20", opacity: 0 },
      defaults.slide
    ),
    
    'text-fade-soft': createAnimation(
      { opacity: 0.3 },
      defaults.fade
    ),
    
    'text-fade': createAnimation(
      { opacity: 0 },
      defaults.fade
    ),
    
    'text-blur': createAnimation(
      { 
        opacity: 0, 
        filter: 'blur(10px)'  
      },
      defaults.blur
    ),

    'text-blur-left': createAnimation(
      { 
        opacity: 0, 
        filter: 'blur(10px)',
        x: 30
      },
      defaults.blur
    ),

    'text-blur-right': createAnimation(
      { 
        opacity: 0, 
        filter: 'blur(10px)',
        x: -30
      },
      defaults.blur
    ),

    'text-blur-up': createAnimation(
      { 
        opacity: 0, 
        filter: 'blur(10px)',
        y: "110%"
      },
      defaults.blur
    ),

    'text-blur-down': createAnimation(
      { 
        opacity: 0, 
        filter: 'blur(10px)',
        y: "-110%"  
      },
      defaults.blur
    ),
    
    'text-rotate-soft': (element, splitElements, split, duration, stagger, delay, ease) => {
      const tl = gsap.timeline();
      const animationTarget = splitElements[split];

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
          if (!element.hasAttribute('aa-scrub')) {
            gsap.set(element, { visibility: 'visible' });
          }
        }
      });

      return tl;
    }
  };

  return {
    // Return the animations object and a helper function to get animation by type
    animations: textAnimations,
    getAnimation: (type) => {
      // Remove -clip suffix if present
      const baseType = type.replace('-clip', '');
      return textAnimations[baseType];
    }
  };
}