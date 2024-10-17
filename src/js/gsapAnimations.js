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

    splitText: (element, type) => {
      let types;
      switch (type) {
        case 'lines':
          types = 'lines';
          break;
        case 'words':
          types = 'lines, words';
          break;
        case 'chars':
          types = 'lines, words, chars';
          break;
        default:
          types = 'lines'; // Default to lines if no valid type is provided
      }
      return new SplitType(element, { types: types });
    },

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
        y: 50,
        opacity: 0,
        rotation: 10,
        duration,
        stagger,
        ease
      }, ">");

      return tl;
    },

  };
}