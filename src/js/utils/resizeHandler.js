import { debounce } from './shared';
import { getElementSettings } from './elementAttributes';
import { getElementTemplateSettings } from './templateHandler';
import { processTemplates } from './templateHandler';

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
        if ((animType && (
          animType.includes('|') || 
          animType.includes('slider')
        )) || animTypeOriginal) {
          // Get new settings with updated animation type
          const settings = getElementSettings(element, initOptions, isMobile);
          element.settings = settings;
          setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
        }
      });

      // Rebuild template-based animations
      if (initOptions.templates) {
        // Process templates to get the final class names
        const templates = processTemplates(initOptions);
        if (templates) {
          // Create a single selector for all template classes
          const templateSelectors = Object.keys(templates).map(className => 
            `.${className}:not([aa-animate]):not([aa-load])`
          ).join(',');
          
          // Get all template elements in a single query
          document.querySelectorAll(templateSelectors).forEach(element => {
            const templateSettings = getElementTemplateSettings(element, isMobile);
            if (templateSettings?.animationType) {
              // Skip text animations unless they have mobile/desktop variants
              const isTextAnimation = templateSettings.animationType.startsWith('text-');
              const hasMobileVariant = templateSettings.animationType.includes('|');
              
              if (!isTextAnimation || hasMobileVariant) {
                // Update settings with new animation type
                element.settings = {
                  ...element.settings,
                  ...templateSettings
                };
                setupGSAPAnimations(element, element.settings, initOptions, isMobile, modules);
              }
            }
          });
        }
      }
      
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