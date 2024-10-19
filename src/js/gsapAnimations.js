export function createAnimations(gsap) {
  return {
    /*
    * TEXT SLIDE
    */
    textSlideUp: (element, splitText, splitType, duration, stagger, delay, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      delay = delay ?? 0;
      ease = ease ?? 'back.out';
      
      const baseSplitType = splitType.split('.')[0]; // Extract the base split type (before the dot)
      const animationTarget = splitText[baseSplitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      // Set initial opacity of the whole element
      tl.set(element, { autoAlpha: 0 });

      tl.from(animationTarget, {
        y: "110%",
        opacity: 0,
        duration,
        stagger,
        ease,
        delay,
        onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
      }, ">");

      return tl;
    },

    textSlideDown: (element, splitText, splitType, duration, stagger, delay, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      delay = delay ?? 0;
      ease = ease ?? 'back.out';
      
      const baseSplitType = splitType.split('.')[0]; // Extract the base split type (before the dot)
      const animationTarget = splitText[baseSplitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      // Set initial opacity of the whole element
      tl.set(element, { autoAlpha: 0 });

      tl.from(animationTarget, {
        y: "-110%",
        opacity: 0,
        duration,
        stagger,
        ease,
        delay,
        onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
      }, ">");

      return tl;
    },

    /*
    * TEXT ROTATE 
    */
    textTurnUp: (element, splitText, splitType, duration, stagger, delay, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      delay = delay ?? 0;
      ease = ease ?? 'back.out';
      
      const baseSplitType = splitType.split('.')[0]; // Extract the base split type (before the dot)
      const animationTarget = splitText[baseSplitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      // Set initial opacity of the whole element
      tl.set(element, { autoAlpha: 0 });

      tl.from(animationTarget, {
        y: "110%",
        opacity: 0,
        rotation: 10,
        duration,
        stagger,
        ease,
        delay,
        onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
      }, ">");

      return tl;
    },

    textTurnDown: (element, splitText, splitType, duration, stagger, delay, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      delay = delay ?? 0;
      ease = ease ?? 'back.out';
      
      const baseSplitType = splitType.split('.')[0]; // Extract the base split type (before the dot)
      const animationTarget = splitText[baseSplitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      // Set initial opacity of the whole element
      tl.set(element, { autoAlpha: 0 });

      tl.from(animationTarget, {
        y: "-110%",
        opacity: 0,
        rotation: -10,
        duration,
        stagger,
        ease,
        delay,
        onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
      }, ">");

      return tl;
    },

    /*
    * TEXT CASCADE
    */
    textCascadeUp: (element, splitText, duration, stagger, delay, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      delay = delay ?? 0;
      ease = ease ?? 'expo.out';
    
      // Ensure we have both lines and words split
      const lines = splitText.lines;
      const words = splitText.words;

      const tl = gsap.timeline();

      tl.from(element, { 
        autoAlpha: 0,
        duration: 0.1
      });

      lines.forEach((line, index) => {
        const wordsInLine = words.filter(word => line.contains(word));
        
        tl.from(wordsInLine, {
          y: "110%",
          opacity: 0,
          duration,
          stagger,
          ease,
          delay
        }, index * stagger * 3); // Delay each line
      });

      return tl;
    },

    textCascadeDown: (element, splitText, duration, stagger, delay, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      delay = delay ?? 0;
      ease = ease ?? 'expo.out';
    
      // Ensure we have both lines and words split
      const lines = splitText.lines;
      const words = splitText.words;

      const tl = gsap.timeline();

      // Set initial opacity of the whole element
      tl.set(element, { autoAlpha: 0 });

      lines.forEach((line, index) => {
        const wordsInLine = words.filter(word => line.contains(word));
        
        tl.from(wordsInLine, {
          y: "-110%",
          opacity: 0,
          duration,
          stagger,
          ease,
          delay,
          onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
        }, index * stagger * 4); // Delay each line
      });

      return tl;
    },

    /*
    * ROTATE IN TOP FORWARD
    */
    textRotateSoft: (element, splitText, splitType = 'lines', duration, stagger, delay, ease) => {
      duration = duration ?? 1.2;
      stagger = stagger ?? 0.1;
      delay = delay ?? 0;
      ease = ease ?? 'power3.out';

      // Split the text
      const baseSplitType = splitType.split('.')[0]; // Extract the base split type (before the dot)
      const animationTarget = splitText[baseSplitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      // Calculate perspective in pixels based on font size
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const perspectiveInPixels = fontSize * 3; // 3em

      // Add perspective wrapper around each line
      animationTarget.forEach(line => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('line-perspective-wrapper');
        line.parentNode.insertBefore(wrapper, line); // insert the wrapper before the line  
        wrapper.appendChild(line); // append the line to the wrapper
      });


      // Set initial opacity of the whole element
      tl.set(element, { 
        autoAlpha: 0
      });

      tl.set('.line-perspective-wrapper', {
        transformStyle: 'preserve-3d',
        perspective: perspectiveInPixels
      });

      tl.set(animationTarget, {
        transformOrigin: '50% 0%'
      });

      // Animate each split element
      tl.from(animationTarget, {
        autoAlpha: 0,
        rotateX: -90,
        y: '100%',
        scaleX: 0.75,
        duration,
        stagger,
        ease,
        delay,
        onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
      });

      return tl;
    }

  };
}
