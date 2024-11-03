import { debounce } from './shared';

export function setupResizeHandler(ScrollTrigger, allAnimatedElements, settings, isMobile, importedModules, setupAnimations) {
  let prevWidth = window.innerWidth;

  const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    
    if (currentWidth !== prevWidth) {
      isMobile = currentWidth < 768;
      // Refresh all ScrollTriggers
      ScrollTrigger.refresh();
      // Re-setup animations
      setupAnimations(allAnimatedElements, settings, isMobile, importedModules.animations, importedModules.splitText);
      
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