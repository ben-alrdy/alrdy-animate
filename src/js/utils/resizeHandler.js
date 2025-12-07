import { debounce } from './shared';
import { getElementSettings, updateElementSettingsOnResize } from './elementAttributes';
import { getElementTemplateSettings, updateTemplateSettingsOnResize } from './templateHandler';
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
    // Also rebuild reveal-slices on height change (dimensions matter)
    if (!widthChanged && heightChanged) {
      if (initOptions.gsapFeatures.includes('section')) {
        document.querySelectorAll('[aa-animate="pin-stack"]').forEach(element => {
          if (modules.animations?.updatePinStackOnResize) {
            modules.animations.updatePinStackOnResize(element);
          }
        });
      }
      
      // Rebuild reveal-slices animations on height change
      if (modules.animations?.cleanupRevealSlices) {
        document.querySelectorAll("[aa-animate*='reveal-slices']").forEach(element => {
          const animType = element.getAttribute('aa-animate');
          if (animType && animType.includes('reveal-slices')) {
            // Cleanup existing animation
            modules.animations.cleanupRevealSlices(element);
            
            // Get new settings and rebuild
            const aaAttributeType = element._aaAttributeType;
            const settings = updateElementSettingsOnResize(element, element.settings, initOptions, isMobile, aaAttributeType);
            element.settings = settings;
            setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
          }
        });
      }
      
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

      // Cleanup and rebuild reveal-slices animations (dimensions matter, so rebuild on any resize)
      if (modules.animations?.cleanupRevealSlices) {
        document.querySelectorAll("[aa-animate*='reveal-slices']").forEach(element => {
          const animType = element.getAttribute('aa-animate');
          if (animType && animType.includes('reveal-slices')) {
            // Cleanup existing animation
            modules.animations.cleanupRevealSlices(element);
            
            // Get new settings and rebuild
            const aaAttributeType = element._aaAttributeType;
            const settings = updateElementSettingsOnResize(element, element.settings, initOptions, isMobile, aaAttributeType);
            element.settings = settings;
            setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
          }
        });
      }

      // Rebuild scroll animations for elements that need updating
      document.querySelectorAll("[aa-animate], [aa-animate-original]").forEach(element => {
        const animType = element.getAttribute('aa-animate');
        const animTypeOriginal = element.getAttribute('aa-animate-original');
        
        // Skip reveal-slices as they're already handled above
        if (animType && animType.includes('reveal-slices')) {
          return;
        }
        
        // Rebuild if has mobile/desktop variants (contains |)
        if ((animType && animType.includes('|')) || animTypeOriginal) {
          // Get new settings with updated animation type
          const aaAttributeType = element._aaAttributeType;
          const settings = updateElementSettingsOnResize(element, element.settings, initOptions, isMobile, aaAttributeType);
          
          // Clear any existing GSAP tweens and properties before rebuilding
          if (modules.gsap) {
            modules.gsap.killTweensOf(element);
            modules.gsap.set(element, { clearProps: "all" });
          }
          
          element.settings = settings;
          setupGSAPAnimations(element, settings, initOptions, isMobile, modules);
        }
      });

      // Rebuild ALL slider components (since they all get cleaned up)
      document.querySelectorAll("[aa-slider]").forEach(element => {

        // Get new settings with updated slider type
        const aaAttributeType = element._aaAttributeType;
        const settings = updateElementSettingsOnResize(element, element.settings, initOptions, isMobile, aaAttributeType);
        element.settings = settings;
        
        // Use the slider component setup function
        if (modules.animations?.slider && settings.sliderType && settings.sliderType !== 'none') {
          modules.animations.slider(element, settings.sliderType, settings.duration, settings.ease, settings.delay);
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
            if (element.settings) {
              const updatedSettings = updateTemplateSettingsOnResize(element, element.settings, isMobile);
              if (updatedSettings) {
                // Always rebuild text animations on resize (they need split text recalculation)
                // For other animations, only rebuild if they have mobile/desktop variants
                const isTextAnimation = updatedSettings.animationType?.startsWith('text-');
                const hasMobileVariant = updatedSettings.animationType?.includes('|');
                
                if (isTextAnimation || hasMobileVariant) {
                  // Clear any existing GSAP tweens and properties before rebuilding
                  if (modules.gsap) {
                    modules.gsap.killTweensOf(element);
                    modules.gsap.set(element, { clearProps: "all" });
                  }
                  
                  element.settings = updatedSettings;
                  setupGSAPAnimations(element, element.settings, initOptions, isMobile, modules);
                }
              }
            }
          });
        }
      }

      // Recalculate nav indicators
      if (modules.Flip) {
        const navElement = document.querySelector('[aa-nav]');
        if (navElement) {
          const currentIndicator = navElement.querySelector('[aa-nav-current-indicator]');
          const hoverIndicator = navElement.querySelector('[aa-nav-hover-indicator]');
          const navigationItems = navElement.querySelectorAll("[aa-scroll-target]");
          
          if (navigationItems.length > 0) {
            // Get current item or fallback to first
            const getCurrentItem = () => navElement.querySelector("[aa-scroll-target].is-current") || navigationItems[0];
            const currentItem = getCurrentItem();
            
            if (currentItem) {
              // Reposition current indicator
              if (currentIndicator) {
                modules.Flip.fit(currentIndicator, currentItem, { 
                  duration: 0, 
                  absolute: true, 
                  simple: true 
                });
              }
              
              // Reposition hover indicator
              if (hoverIndicator) {
                modules.Flip.fit(hoverIndicator, currentItem, { 
                  duration: 0, 
                  absolute: true, 
                  simple: true 
                });
              }
            }
          }
        }
      }
      
      // Refresh ScrollTrigger after rebuilding animations
      if (modules.ScrollTrigger) {
        modules.ScrollTrigger.refresh(true);
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