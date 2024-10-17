let gsap, SplitType;

async function loadDependencies() {
  if (!gsap) {
    const gsapModule = await import('gsap');
    gsap = gsapModule.gsap;
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);
  }
  if (!SplitType) {
    SplitType = (await import('split-type')).default;
  }
}

export async function createAnimations() {
  await loadDependencies();

  return {

    /*
    * SPLIT TEXT HELPER
    */
    splitText: (element, type = 'lines') => {

      const isClip = type.includes('clip'); // check if clip option is included in the type
      
      // default split type is lines, checks if chars or words are included in the type
      let types = 'lines';
      if (type.includes('chars')) {
        types = 'lines, words, chars';
      } else if (type.includes('words')) {
        types = 'lines, words';
      }

      // split the text into lines, words or chars
      let result = new SplitType(element, { types });

      // if clip option is included, wrap each line in a clip wrapper
      if (result.lines && isClip) {
        result.lines.forEach(line => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('line-clip-wrapper');
          line.parentNode.insertBefore(wrapper, line); // insert the wrapper before the line  
          wrapper.appendChild(line); // append the line to the wrapper
        });
      }

      return result;
    },

    /*
    * TEXT SLIDE
    */
    textSlideUp: (element, splitText, splitType, duration, stagger, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      ease = ease ?? 'back.out';
      
      const baseSplitType = splitType.split('.')[0]; // Extract the base split type (before the dot)
      const animationTarget = splitText[baseSplitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      tl.from(element, {
        autoAlpha: 0,      
        duration: 0.1
      });

      tl.from(animationTarget, {
        y: "110%",
        duration,
        stagger,
        ease
      }, ">");

      return tl;
    },

    textSlideDown: (element, splitText, splitType, duration, stagger, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      ease = ease ?? 'back.out';
      
      const animationTarget = splitText[splitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      tl.from(element, {
        autoAlpha: 0,      
        duration: 0.1
      });

      tl.from(animationTarget, {
        y: "-110%",
        duration,
        stagger,
        ease
      }, ">");

      return tl;
    },

    /*
    * TEXT ROTATE 
    */
    textRotateUp: (element, splitText, splitType, duration, stagger, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      ease = ease ?? 'back.out';
      
      const animationTarget = splitText[splitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      tl.from(element, {
        autoAlpha: 0,      
        duration: 0.1
      });

      tl.from(animationTarget, {
        y: "110%",
        opacity: 0,
        rotation: 10,
        duration,
        stagger,
        ease
      }, ">");

      return tl;
    },

    textRotateDown: (element, splitText, splitType, duration, stagger, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
      ease = ease ?? 'back.out';
      
      const animationTarget = splitText[splitType] || splitText.lines;       // Determine the animation target based on the split type or defaulting to lines
      const tl = gsap.timeline();

      tl.from(element, {
        autoAlpha: 0,      
        duration: 0.1
      });

      tl.from(animationTarget, {
        y: "-110%",
        opacity: 0,
        rotation: -10,
        duration,
        stagger,
        ease
      }, ">");

      return tl;
    },

    /*
    * TEXT CASCADE
    */
    textCascadeUp: (element, splitText, duration, stagger, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
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
          ease 
        }, index * stagger * 4); // Delay each line
      });

      return tl;
    },

    textCascadeDown: (element, splitText, duration, stagger, ease) => {
      duration = duration ?? 0.5;
      stagger = stagger ?? 0.05;
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
          y: "-110%",
          opacity: 0,
          duration,
          stagger,
          ease 
        }, index * stagger * 4); // Delay each line
      });

      return tl;
    }

  };
}
