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

      // Only rebuild slider and text animations
      document.querySelectorAll("[aa-animate]").forEach(element => {
        const aaAnimate = element.getAttribute('aa-animate');
        // Only rebuild slider and text animations
        if (aaAnimate && (aaAnimate.includes('slider') || aaAnimate.includes('text'))) {
          setupGSAPAnimations(element, element.settings, initOptions, isMobile, modules);
        }
      });
      
      // modules.ScrollTrigger.refresh();
      
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