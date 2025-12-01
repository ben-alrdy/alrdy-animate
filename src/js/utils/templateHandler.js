import { getTheme } from './themeRegistry';
import { parseResponsiveAttribute } from './elementAttributes';

// Store for processed templates
let processedTemplates = null;

// CSS animations that should be applied via aa-animate attribute
const CSS_ANIMATIONS = [
  // Transition-based (_transitions.scss)
  'fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right',
  'zoom-in', 'zoom-in-up', 'zoom-in-down', 
  'zoom-out', 'zoom-out-up', 'zoom-out-down',
  'slide-up', 'slide-down', 'slide-left', 'slide-right',
  'blur-in',
  'flip-left', 'flip-right', 'flip-up', 'flip-down',
  'pseudo-reveal-up', 'pseudo-reveal-down', 'pseudo-reveal-left', 'pseudo-reveal-right',
  
  // Keyframe-based (_animations.scss)
  'float-up', 'float-down', 'float-left', 'float-right',
  'swing-fwd', 'swing-bwd',
  'turn-3d-soft', 'turn-3d-soft-3em', 'turn-3d-elliptic',
  'rotate-br-cw', 'rotate-br-ccw', 'rotate-bl-cw', 'rotate-bl-ccw',
  'rotate-tr-cw', 'rotate-tr-ccw', 'rotate-tl-cw', 'rotate-tl-ccw',
  'rotate-c-cw', 'rotate-c-ccw'
];

/**
 * Check if an animation type is a CSS-based animation
 * @param {string} animationType - The animation type to check
 * @returns {boolean} True if it's a CSS animation
 */
function isCSSAnimation(animationType) {
  if (!animationType) return false;
  return CSS_ANIMATIONS.includes(animationType);
}

/**
 * Process templates from init options
 * @param {Object} options - Init options containing template configuration
 * @returns {Object} Processed templates ready to be applied
 */
export function processTemplates(options) {
  if (!options.templates) return null;
  
  const { theme, custom } = options.templates;
  let templates = {};

  // If theme is specified, get its configurations
  if (theme) {
    const themeConfig = getTheme(theme);
    if (themeConfig) {
      templates = { ...themeConfig };
    }
  }

  // Apply custom overrides if specified
  if (custom) {
    templates = {
      ...templates,
      ...custom
    };
  }

  // Store processed templates
  processedTemplates = templates;
  return templates;
}

/**
 * Find a matching template for an element by checking each class name
 * @param {HTMLElement} element - The element to find template for
 * @returns {Object|null} Matching template or null if no match
 */
function findTemplateForElement(element) {
  if (!processedTemplates) return null;
  
  // Handle both string className and className.baseVal (for SVG elements)
  const className = typeof element.className === 'string' 
    ? element.className 
    : element.className?.baseVal || '';
  
  if (!className) return null;
  
  // Split by spaces and check each class individually
  const classes = className.trim().split(/\s+/);
  for (const cls of classes) {
    if (processedTemplates[cls]) {
      return processedTemplates[cls];
    }
  }
  
  return null;
}

/**
 * Get animation settings for an element based on templates
 * @param {HTMLElement} element - The element to get settings for
 * @returns {Object|null} Animation settings or null if no match
 */
export function getElementTemplateSettings(element, isMobile) {
  if (!processedTemplates) return null;

  const template = findTemplateForElement(element);
  
  if (!template) return null;
  
  // Create a new settings object
  const settings = { ...template };
  
  // Handle mobile/desktop animation split
  if (settings.animationType && settings.animationType.includes('|')) {
    const [desktopAnim, mobileAnim] = settings.animationType.split('|');
    settings.animationType = isMobile ? mobileAnim : desktopAnim;
  }
  
  // Check if it's a CSS animation and set aa-animate attribute
  if (settings.animationType && isCSSAnimation(settings.animationType)) {
    // Set aa-animate attribute directly
    element.setAttribute('aa-animate', settings.animationType);
    
    // Update the element's attribute type cache so it gets processed as an animate element
    if (element._aaAttributeType) {
      element._aaAttributeType.isAnimate = true;
    }
    
    // Set CSS custom properties only if they are defined
    if (settings.duration) {
      element.style.setProperty('--aa-duration', `${settings.duration}s`);
    }
    if (settings.delay) {
      element.style.setProperty('--aa-delay', `${settings.delay}s`);
    }
    if (settings.distance) {
      element.style.setProperty('--aa-distance', settings.distance);
    }
    if (settings.opacity !== undefined) {
      element.style.setProperty('--aa-opacity', settings.opacity);
    }
  }
  
  // Add element-specific properties
  settings.anchorElement = element; // Each element is its own anchor
  
  return settings;
}

/**
 * Get final settings for an element, merging template settings with default settings
 * @param {HTMLElement} element - The element to get settings for
 * @param {Object} defaultSettings - Default settings to merge with
 * @returns {Object|null} Final settings or null if no settings found
 */
export function getFinalSettings(element, defaultSettings, isMobile) {
  // Skip template settings if element has aa-animate, aa-slider, aa-accordion, or aa-marquee attributes
  if (element.hasAttribute('aa-animate') || element.hasAttribute('aa-slider') || element.hasAttribute('aa-accordion') || element.hasAttribute('aa-marquee')) return null;

  // Get template settings if available
  const templateSettings = getElementTemplateSettings(element, isMobile);
  if (!templateSettings) return null;

  // Merge with default settings, ensuring each element gets its own unique settings
  return {
    ...defaultSettings,
    ...templateSettings,
    // Ensure these are always element-specific
    anchorElement: element,
    anchorSelector: null // Don't use selectors for template elements
  };
}

/**
 * Update only responsive properties in template settings on resize
 * @param {HTMLElement} element - The element to update
 * @param {Object} existingSettings - Current element settings
 * @param {boolean} isMobile - Whether current device is mobile
 * @returns {Object|null} Updated settings with only responsive properties changed, or null if no template match
 */
export function updateTemplateSettingsOnResize(element, existingSettings, isMobile) {
  if (!processedTemplates) return null;

  const template = findTemplateForElement(element);
  
  if (!template) return null;
  
  const updates = {};
  
  // Handle mobile/desktop animation split
  if (template.animationType && template.animationType.includes('|')) {
    updates.animationType = parseResponsiveAttribute(template.animationType, null, isMobile);
  }
  
  // For text animations, always return updated settings (they need rebuild for split text recalculation)
  // For other animations, only return updates if there are actual changes
  const isTextAnimation = template.animationType?.startsWith('text-');
  if (isTextAnimation || Object.keys(updates).length > 0) {
    return { ...existingSettings, ...updates };
  }
  
  return existingSettings;
}

/**
 * Clear processed templates
 */
export function clearProcessedTemplates() {
  processedTemplates = null;
} 