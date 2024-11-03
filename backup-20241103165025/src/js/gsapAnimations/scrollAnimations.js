export function stickyNav(gsap, ScrollTrigger, element, ease, duration) {
  ease = ease ?? 'back.inOut';
  duration = duration ?? 0.4;
  let isVisible = true;
  let lastScrollTop = 0;
  const scrollThreshold = 20;

  const showNavAtTop = () => {
    isVisible = true;
    gsap.to(element, { y: '0%', duration, ease, overwrite: true });
  };

  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      let currentScrollTop = self.scroll();

      if (currentScrollTop <= 10) {
        showNavAtTop();
        lastScrollTop = currentScrollTop;
        return;
      }

      let scrollDelta = currentScrollTop - lastScrollTop;

      if (Math.abs(scrollDelta) > scrollThreshold) {
        if (scrollDelta > 0 && isVisible) {
          isVisible = false;
          gsap.to(element, { y: '-100%', duration: duration * 2, ease, overwrite: true });
        } else if (scrollDelta < 0 && !isVisible) {
          showNavAtTop();
        }
        lastScrollTop = currentScrollTop;
      }
    },
    onLeaveBack: showNavAtTop,
    onLeave: showNavAtTop
  });
}

export function createScrollAnimations(gsap, ScrollTrigger) {
  return {
    stickyNav: (element, ease, duration) => stickyNav(gsap, ScrollTrigger, element, ease, duration)
  };
} 