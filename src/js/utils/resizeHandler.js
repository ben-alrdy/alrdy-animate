import { debounce } from './shared';
import { getElementSettings } from './elementAttributes';

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

      // Rebuild animations for elements that need updating
      document.querySelectorAll("[aa-animate], [aa-animate-original]").forEach(element => {
        const animType = element.getAttribute('aa-animate');
        const animTypeOriginal = element.getAttribute('aa-animate-original');
        
        // Rebuild if:
        // 1. Has mobile/desktop variants (contains |)
        // 2. Is a slider animation
        // 3. Is a text animation
        if ((animType && (
          animType.includes('|') || 
          animType.includes('slider') || 
          animType.includes('text')
        )) || animTypeOriginal) {
          // Clear existing split instance
          if (element.splitInstance) {
            element.splitInstance.revert();
          }
          
          // Get new settings with updated animation type
          const settings = getElementSettings(element, initOptions);
          element.settings = settings;
          setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
        }
      });
      
      console.log('REBUILDING ANIMATIONS');
      // REMOVED SCROLLTRIGGER REFRESH BECAUSE GSAP IS HANDLING IT
      /* if (modules.ScrollTrigger) {
        modules.ScrollTrigger.refresh();
      } */
      
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