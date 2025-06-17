export function createTextAnimations(gsap) {
  // Animation defaults
  const defaults = {
    slide:        { duration: 0.5, stagger: 0.1, ease: 'back.out' },
    rotateSoft:   { duration: 1.2, stagger: 0.3, ease: 'circ.out' },
    fade:         { duration: 1.0, stagger: 0.08, ease: 'power2.inOut' },
    blur:         { duration: 0.4, stagger: 0.02, ease: 'ease-out' },
  };

  // Helper function to create base animation configuration
  function createBaseAnimation(element, split, duration, stagger, delay, ease, props) {
    const baseProps = {
      duration,
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
        onSplit: (self) => {
          const tl = gsap.timeline();
          self.lines.forEach((line, index) => {
            const wordsInLine = self.words.filter(word => line.contains(word));
            tl.from(wordsInLine, {
              ...baseProps,
              ...props,
              stagger: stagger
            }, index * stagger * 3);
          });
          return tl;
        }
      };
    }

    // Handle lines&chars split type
    if (split === 'lines&chars') {
      return {
        onSplit: (self) => {
          const tl = gsap.timeline();
          self.lines.forEach((line, index) => {
            const charsInLine = self.chars.filter(char => line.contains(char));
            tl.from(charsInLine, {
              ...baseProps,
              ...props,
              stagger: stagger
            }, index * stagger * 6);
          });
          return tl;
        }
      };
    }

    // Handle regular split types
    return {
      onSplit: (self) => {
        const tl = gsap.timeline();
        // Get the base split type without any modifiers
        const baseSplitType = split.split('-')[0].split('|')[0];
        const elements = self[baseSplitType];
        
        // Check if we have pre-created groups
        if (self._groups) {
          // Animate each group sequentially
          self._groups.forEach((group, index) => {
            tl.from(group, {
              ...baseProps,
              ...props,
              stagger: 0 // No stagger within groups
            }, index * stagger); // Only stagger between groups
          });
        } else {
          // Regular sequential animation
          tl.from(elements, {
            ...baseProps,
            ...props,
            stagger: stagger
          });
        }
        return tl;
      }
    };
  }

  // Create animation function with defaults
  function createAnimation(animationProps, defaultValues) {
    return (element, split, duration, stagger, delay, ease) => {
      return createBaseAnimation(
        element,
        split,
        duration ?? defaultValues.duration,
        stagger ?? defaultValues.stagger,
        delay,
        ease ?? defaultValues.ease,
        animationProps
      );
    };
  }

  // Block animation factory for left, right, up, down
  function createBlockAnimation(direction) {
    const config = {
      left:  {
        initialClip: 'inset(0% 0% 0% 100%)',
        revealClip:  'inset(0% 0% 0% 0%)',
        hideClip:    'inset(0% 100% 0% 0%)',
        textInit:    { x: '0.6em', y: 0 },
        textFinal:   { x: 0, y: 0 }
      },
      right: {
        initialClip: 'inset(0% 100% 0% 0%)',
        revealClip:  'inset(0% 0% 0% 0%)',
        hideClip:    'inset(0% 0% 0% 100%)',
        textInit:    { x: '-0.6em', y: 0 },
        textFinal:   { x: 0, y: 0 }
      },
      up:    {
        initialClip: 'inset(100% 0% 0% 0%)',
        revealClip:  'inset(0% 0% 0% 0%)',
        hideClip:    'inset(0% 0% 100% 0%)',
        textInit:    { x: 0, y: '0.6em' },
        textFinal:   { x: 0, y: 0 }
      },
      down:  {
        initialClip: 'inset(0% 0% 100% 0%)',
        revealClip:  'inset(0% 0% 0% 0%)',
        hideClip:    'inset(100% 0% 0% 0%)',
        textInit:    { x: 0, y: '-0.6em' },
        textFinal:   { x: 0, y: 0 }
      }
    };
    return (element, split, duration, stagger, delay, ease) => ({
      onSplit: (self) => {
        const tl = gsap.timeline({ delay });
        const color = element.getAttribute('aa-color') || '#000000';
        const { initialClip, revealClip, hideClip, textInit, textFinal } = config[direction];

        self.lines.forEach((line, i) => {
          // Create background element
          const blockDiv = document.createElement('div');
          blockDiv.className = 'aa-block-bg';
          blockDiv.style.backgroundColor = color;

          // Wrap text content in div
          const textContent = line.innerHTML;
          const textDiv = document.createElement('div');
          textDiv.className = 'aa-block-text';
          textDiv.innerHTML = textContent;

          line.innerHTML = '';
          line.appendChild(blockDiv);
          line.appendChild(textDiv);

          // Set initial states
          gsap.set(blockDiv, { clipPath: initialClip });
          gsap.set(textDiv, { opacity: 0, ...textInit });

          // Split duration among phases
          const revealDur = duration * 0.4;
          const shrinkDur = duration * 0.6;
          const textDur   = duration * 0.4;

          const lineTl = gsap.timeline();
          lineTl
            .to(blockDiv, { clipPath: revealClip, duration: revealDur, ease })
            .to(blockDiv, { clipPath: hideClip, duration: shrinkDur, ease })
            .to(textDiv, { opacity: 1, ...textFinal, duration: textDur, ease }, '<');

          tl.add(lineTl, i * (stagger ?? 0));
        });

        return tl;
      }
    });
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

    'text-scale-up': createAnimation(
      { 
        y: "120%", 
        opacity: 0, 
        scale: 0.9,
        transformOrigin: "left center"
      },
      defaults.slide
    ),
  
    'text-fade-30': createAnimation(
      { opacity: 0.3 },
      defaults.fade
    ),
    'text-fade-10': createAnimation(
      { opacity: 0.1 },
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
    
    'text-block-left': createBlockAnimation('left'),
    'text-block-right': createBlockAnimation('right'),
    'text-block-up': createBlockAnimation('up'),
    'text-block-down': createBlockAnimation('down'),
    
    'text-rotate-soft': (element, split, duration, stagger, delay, ease) => {
      return {
        onSplit: (self) => {
          const tl = gsap.timeline();
          
          if (!self.lines || self.lines.length === 0) return tl;

          // Calculate perspective
          const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
          const perspectiveInPixels = fontSize * 5;

          // Add perspective wrappers
          self.lines.forEach(line => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('line-perspective-wrapper');
            line.parentNode.insertBefore(wrapper, line);
            wrapper.appendChild(line);
          });

          tl.set('.line-perspective-wrapper', {
            transformStyle: 'preserve-3d',
            perspective: perspectiveInPixels
          })
          .set(self.lines, {
            transformOrigin: '50% 0%'
          });

          tl.from(self.lines, {
            autoAlpha: 0,
            rotateX: -90,
            y: '100%',
            scaleX: 0.75,
            duration: duration ?? defaults.rotateSoft.duration,
            stagger: stagger ?? defaults.rotateSoft.stagger,
            ease: ease ?? defaults.rotateSoft.ease,
            delay,
            onStart: () => {
              if (!element.hasAttribute('aa-scrub')) {
                gsap.set(element, { visibility: 'visible' });
              }
            }
          });

          return tl;
        }
      };
    },
  };

  return {
    // Return the animations object and a helper function to get animation by type
    animations: textAnimations,
    getAnimation: (type) => {
      // Remove any mask suffix (-clip, -lines, -words, -chars)
      const baseType = type.replace(/-clip|-lines|-words|-chars$/, '');
      return textAnimations[baseType];
    }
  };
}