import { getTheme } from './themeRegistry';

// Store for processed templates
let processedTemplates = null;

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
 * Get animation settings for an element based on templates
 * @param {HTMLElement} element - The element to get settings for
 * @returns {Object|null} Animation settings or null if no match
 */
export function getElementTemplateSettings(element, isMobile) {
  if (!processedTemplates) return null;

  const className = element.className;
  const template = processedTemplates[className];
  
  if (!template) return null;
  
  // Create a new settings object
  const settings = { ...template };
  
  // Check if it's a CSS animation (starts with aa-)
  if (settings.animationType?.startsWith('aa-')) {
    // Add the class directly (no need to modify the name)
    element.classList.add(settings.animationType);
    
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
  }
  
  // Handle mobile/desktop animation split
  if (settings.animationType && settings.animationType.includes('|')) {
    const [desktopAnim, mobileAnim] = settings.animationType.split('|');
    settings.animationType = isMobile ? mobileAnim : desktopAnim;
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
  // Skip template settings if element has aa-animate attribute
  if (element.hasAttribute('aa-animate')) return null;

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
 * Clear processed templates
 */
export function clearProcessedTemplates() {
  processedTemplates = null;
} 