import { debounce } from './shared';
import { handleLazyLoadedImages } from './lazyLoadHandler';

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

      // Refresh ScrollTrigger for all animations
      modules.ScrollTrigger.refresh(true);
      
      // Only rebuild specific animations that need recalculation
      document.querySelectorAll("[aa-animate]").forEach(element => {
        const animationType = element.getAttribute('aa-animate');
        const baseType = animationType.includes('-') ? animationType.split('-')[0] : animationType;
          
        // Only rebuild animations that need dimension recalculation
        const needsRebuild = [
          'slider',
          'text'  // Due to SplitText needing recalc
        ].includes(baseType);
        
        if (needsRebuild) {
          setupGSAPAnimations(element, element.settings, initOptions, isMobile, modules);
        }
      });
      
      // Check for new lazy loaded images
      handleLazyLoadedImages(modules.ScrollTrigger, true);
      
      prevWidth = currentWidth;
    }
  }, 250);

  if (window.matchMedia('(hover: none)').matches) {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        debouncedResize();
      }, 100);
    });
  } else {
    window.addEventListener('resize', debouncedResize);
  }
} 