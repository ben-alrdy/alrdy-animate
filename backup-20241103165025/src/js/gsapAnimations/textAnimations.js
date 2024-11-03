// Helper functions
const getScrollTriggerValues = (isMobile) => {
  return {
    start: isMobile ? "top 40%" : "top 80%",
    end: isMobile ? "top 20%" : "top 40%"
  };
};

function baseTimeline(gsap, element, splitResult, splitType, duration, stagger, delay, ease, scroll, start, end) {
  const tl = gsap.timeline();

  const baseProps = {
    duration,
    stagger,
    ease,
    delay,
    ...(scroll && {
      scrollTrigger: {
        trigger: element,
        start,
        end,
        scrub: scroll.includes('smooth') ? 2 :
               scroll.includes('snap') ? { snap: 0.2 } :
               true
      }
    }),
    onStart: () => gsap.set(element, { autoAlpha: 1 })
  };

  let animationTarget;

  if (splitType === 'lines&words') {
    animationTarget = (animationProps) => {
      splitResult.lines.forEach((line, index) => {
        const wordsInLine = splitResult.words.filter(word => line.contains(word));
        tl.from(wordsInLine, {
          ...baseProps,
          ...animationProps,
        }, index * stagger * 3);
      });
    };
  } else {
    animationTarget = splitResult[splitType];
  }

  return { tl, baseProps, animationTarget };
}

function createTimeline(gsap) {
  return (animationProps) => {
    return (element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll) => {
      const { start, end } = getScrollTriggerValues(isMobile);
      const { tl, baseProps, animationTarget } = baseTimeline(gsap, element, splitResult, splitType, duration, stagger, delay, ease, scroll, start, end);

      const isFadeAnimation = 'opacity' in animationProps && animationProps.opacity > 0;

      if (!isFadeAnimation) {
        tl.set(element, { autoAlpha: 0 });
      }

      if (typeof animationTarget === 'function') {
        animationTarget(animationProps);
      } else {                                   
        tl.from(animationTarget, {
          ...baseProps,
          ...animationProps
        }, ">");
      }

      return tl;
    };
  };
}

export function createTextAnimations(gsap, ScrollTrigger, splitText) {
  const timeline = createTimeline(gsap);

  return {
    textSlideUp: timeline({
      y: "110%",
      opacity: 0,
    }),
    textSlideDown: timeline({
      y: "-110%",
      opacity: 0,
    }),
    textTiltUp: timeline({
      y: "110%",
      opacity: 0,
      rotation: 10,
    }),
    textTiltDown: timeline({
      y: "-110%",
      opacity: 0,
      rotation: -10,
    }),
    textFade: timeline({
      opacity: 0.3
    }),
    textAppear: timeline({
      opacity: 0
    }),
    textRotateSoft: (element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll) => {
      const animationTarget = splitResult[splitType] || splitResult.lines;
      const tl = gsap.timeline();
      const { start, end } = getScrollTriggerValues(isMobile);

      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);
      const perspectiveInPixels = fontSize * 5;

      animationTarget.forEach(line => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('line-perspective-wrapper');
        line.parentNode.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });

      tl.set(element, { autoAlpha: 0 });
      tl.set('.line-perspective-wrapper', {
        transformStyle: 'preserve-3d',
        perspective: perspectiveInPixels
      });
      tl.set(animationTarget, {
        transformOrigin: '50% 0%'
      });

      tl.from(animationTarget, {
        autoAlpha: 0,
        rotateX: -90,
        y: '100%',
        scaleX: 0.75,
        duration,
        stagger,
        ease,
        delay,
        ...(scroll && {
          scrollTrigger: {
            trigger: element,
            start,
            end,
            scrub: scroll.includes('smooth') ? 2 :
                   scroll.includes('snap') ? { snap: 0.2 } :
                   true
          }
        }),
        onStart: () => gsap.set(element, { autoAlpha: 1 })
      });

      return tl;
    }
  };
} 