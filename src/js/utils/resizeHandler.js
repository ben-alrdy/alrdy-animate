import { debounce } from './shared';

export function setupResizeHandler(allAnimatedElements, settings, isMobile, modules, setupAnimations) {
  let prevWidth = window.innerWidth;

  const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    
    if (currentWidth !== prevWidth) {
      isMobile = currentWidth < 768;
      // Refresh all ScrollTriggers
      modules.ScrollTrigger.refresh();
      // Re-setup animations
      setupAnimations(allAnimatedElements, settings, isMobile, modules);
      
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