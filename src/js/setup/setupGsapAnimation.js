export function setupGSAPAnimation(element, anchorElement, elementSettings, settings, animations, splitText, isMobile, gsap, ScrollTrigger) {
  // Clear existing animations
  if (element.timeline) element.timeline.kill();
  if (element.splitInstance) element.splitInstance.revert();

  requestAnimationFrame(() => {
    const tl = createTimeline(element, anchorElement, elementSettings, settings, gsap);
    setupSplitTextAnimation(tl, element, elementSettings, animations, splitText, isMobile);
    
    // Only setup reset trigger if needed
    if (settings.again || elementSettings.anchorSelector) {
      setupResetTrigger(element, anchorElement, elementSettings, ScrollTrigger);
    }
  });
}

function createTimeline(element, anchorElement, elementSettings, settings, gsap) {
  const tl = gsap.timeline({
    paused: true,
    scrollTrigger: {
      trigger: anchorElement,
      start: `top ${(elementSettings.viewportPercentage) * 100}%`,
      onEnter: () => {
        element.classList.add("in-view");
        tl.play();
      },
      markers: settings.debug
    }
  });

  element.timeline = tl;
  return tl;
}

const DEFAULT_SETTINGS = {
  'text-slide-up': {
    duration: 0.5,
    stagger: 0.1,
    ease: 'back.out'
  },
  'text-slide-down': {
    duration: 0.5,
    stagger: 0.1,
    ease: 'back.out'
  },
  'text-tilt-up': {
    duration: 0.5,
    stagger: 0.1,
    ease: 'back.out'
  },
  'text-tilt-down': {
    duration: 0.5,
    stagger: 0.1,
    ease: 'back.out'
  },
  'text-rotate-soft': {
    duration: 1.2,
    stagger: 0.3,
    ease: 'circ.out'
  },
  'text-fade': {
    duration: 1,
    stagger: 0.08,
    ease: 'power2.inOut'
  },
  'text-appear': {
    duration: 1,
    stagger: 0.08,
    ease: 'power2.inOut'
  }
};

function setupSplitTextAnimation(tl, element, elementSettings, animations, splitText, isMobile) {
  const { splitResult, splitType } = splitText(element, elementSettings.splitType);
  element.splitInstance = splitResult;

  const animationType = elementSettings.animationType;
  const defaults = DEFAULT_SETTINGS[animationType] || DEFAULT_SETTINGS['text-fade'];
  
  const animationFunction = animations[animationType];
  if (animationFunction) {
    tl.add(animationFunction(
      element, 
      splitResult, 
      splitType, 
      elementSettings.duration ?? defaults.duration, 
      elementSettings.stagger ?? defaults.stagger, 
      elementSettings.delay, 
      elementSettings.ease ?? defaults.ease, 
      isMobile, 
      elementSettings.scroll
    ));
  }
}

function setupResetTrigger(element, anchorElement, elementSettings, ScrollTrigger) {
  ScrollTrigger.create({
    trigger: anchorElement,
    start: 'top 100%',  // When the element's top hits the bottom of the viewport
    onLeaveBack: () => {
      element.classList.remove("in-view");
      element.timeline.progress(0).pause();  // Reset and pause the timeline
    },
  });
} 