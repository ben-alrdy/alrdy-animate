export function createScrollAnimations(gsap, ScrollTrigger) {
  return {
    stickyNav: (element, ease, duration) => {
      let isVisible = true;
      let lastScrollTop = 0;
      const scrollThreshold = 20;

      // Function to ensure nav is visible at top
      const showNavAtTop = () => {
        isVisible = true;
        gsap.to(element, { y: '0%', duration, ease, overwrite: true });
      };

      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          let currentScrollTop = self.scroll();

          // Always force show at top regardless of previous state
          if (currentScrollTop <= 10) {
            showNavAtTop();
            lastScrollTop = currentScrollTop;
            return;
          }

          let scrollDelta = currentScrollTop - lastScrollTop;

          // Normal scroll behavior
          if (Math.abs(scrollDelta) > scrollThreshold) {
            if (scrollDelta > 0 && isVisible) {
              // Scrolling down, hide the nav
              isVisible = false;
              gsap.to(element, { y: '-100%', duration: duration * 2, ease, overwrite: true });
            } else if (scrollDelta < 0 && !isVisible) {
              // Scrolling up, show the nav
              showNavAtTop();
            }
            lastScrollTop = currentScrollTop;
          }
        },
        onLeaveBack: showNavAtTop,
        onLeave: showNavAtTop
      });
    }
  };
} 