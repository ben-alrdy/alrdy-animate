import { debounce } from './shared';

export function setupResizeHandler(modules, initOptions, isMobile, setupAnimations) {
  let prevWidth = window.innerWidth;

  const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    
    if (currentWidth !== prevWidth) {
      isMobile = currentWidth < 768;

      // Let each module handle its own cleanup
      if (modules.animations?.loop) {
        modules.animations.cleanupLoops();
      }

      // Refresh ScrollTrigger
      modules.ScrollTrigger.refresh();
      
      // Recreate all animations
      setupAnimations(
        document.querySelectorAll("[aa-animate], [aa-children]"),
        initOptions, 
        isMobile, 
        modules
      );
      
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