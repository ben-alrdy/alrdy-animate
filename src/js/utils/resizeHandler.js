import { debounce } from './shared';

export function setupResizeHandler(modules, initOptions, isMobile, setupGSAPAnimations) {
  let prevWidth = window.innerWidth;

  const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    
    if (currentWidth !== prevWidth) {
      isMobile = currentWidth < 768;

      // Cleanup existing animations
      if (modules.animations?.slider) {
        modules.animations.cleanupLoops();
      }

      // Refresh ScrollTrigger
      modules.ScrollTrigger.refresh(true);
      
        // Reset GSAP animations for all elements with aa-animate
        document.querySelectorAll("[aa-animate]").forEach(element => {
          setupGSAPAnimations(element, element.settings, initOptions, isMobile, modules);
        });
      
      prevWidth = currentWidth;
    }
  }, 250);

  window.addEventListener('resize', debouncedResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== prevWidth) {
        debouncedResize();
      }
    }, 100);
  });
} 