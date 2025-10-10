import { debounce } from './shared';
import { getElementSettings } from './elementAttributes';
import { getElementTemplateSettings } from './templateHandler';
import { processTemplates } from './templateHandler';

export function setupResizeHandler(modules, initOptions, isMobile, setupGSAPAnimations) {
  let prevWidth = window.innerWidth;
  let prevHeight = window.innerHeight;

  const debouncedResize = debounce(() => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const widthChanged = currentWidth !== prevWidth;
    const heightChanged = currentHeight !== prevHeight;
    const isMobileDevice = currentWidth < 768;
    
    // On mobile, ignore height changes (address bar causes false positives)
    if (isMobileDevice && !widthChanged) {
      prevHeight = currentHeight;
      return;
    }
    
    // Desktop vertical resize only - update pin animations (don't rebuild from scratch)
    if (!widthChanged && heightChanged && initOptions.gsapFeatures.includes('section')) {
      document.querySelectorAll('[aa-animate="pin-stack"]').forEach(element => {
        if (modules.animations?.updatePinStackOnResize) {
          modules.animations.updatePinStackOnResize(element);
        }
      });
      
      // Refresh ScrollTrigger after updating
      if (modules.ScrollTrigger) {
        modules.ScrollTrigger.refresh(true);
      }
      
      prevHeight = currentHeight;
      return;
    }
    
    // Horizontal resize - full rebuild
    if (widthChanged) {
      isMobile = isMobileDevice;

      // Cleanup existing animations
      if (modules.animations?.slider) {
        modules.animations.cleanupSliders();
      }

      // Rebuild scroll animations for elements that need updating
      document.querySelectorAll("[aa-animate], [aa-animate-original]").forEach(element => {
        const animType = element.getAttribute('aa-animate');
        const animTypeOriginal = element.getAttribute('aa-animate-original');
        
        // Rebuild if has mobile/desktop variants (contains |)
        if ((animType && animType.includes('|')) || animTypeOriginal) {
          // Get new settings with updated animation type
          const settings = getElementSettings(element, initOptions, isMobile);
          element.settings = settings;
          setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
        }
      });

      // Rebuild ALL slider components (since they all get cleaned up)
      document.querySelectorAll("[aa-slider]").forEach(element => {
        const sliderType = element.getAttribute('aa-slider');
        
        if (sliderType) {
          // Get new settings with updated slider type
          const settings = getElementSettings(element, initOptions, isMobile);
          element.settings = settings;
          
          // Use the slider component setup function
          if (modules.animations?.slider && settings.sliderType && settings.sliderType !== 'none') {
            modules.animations.slider(element, settings.sliderType, settings.duration, settings.ease, settings.delay);
          }
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
      prevHeight = currentHeight;
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