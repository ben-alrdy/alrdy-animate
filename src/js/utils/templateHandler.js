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
export function getElementTemplateSettings(element) {
  if (!processedTemplates) return null;

  // Get all classes of the element
  const classes = Array.from(element.classList);
  
  // Find the first matching class in templates
  const matchingClass = classes.find(cls => processedTemplates[cls]);
  
  if (!matchingClass) return null;

  // Create a new settings object for this specific element
  const templateSettings = { ...processedTemplates[matchingClass] };
  
  // Handle mobile/desktop animation split
  if (templateSettings.animationType && templateSettings.animationType.includes('|')) {
    const [desktopAnim, mobileAnim] = templateSettings.animationType.split('|');
    templateSettings.animationType = window.innerWidth < 768 ? mobileAnim : desktopAnim;
  }
  
  // Add element-specific properties
  templateSettings.anchorElement = element; // Each element is its own anchor
  
  return templateSettings;
}

/**
 * Check if an element has any animation attributes
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if element has animation attributes
 */
export function hasAnimationAttributes(element) {
  return element.hasAttribute('aa-animate');
}

/**
 * Get final settings for an element, merging template settings with default settings
 * @param {HTMLElement} element - The element to get settings for
 * @param {Object} defaultSettings - Default settings to merge with
 * @returns {Object|null} Final settings or null if no settings found
 */
export function getFinalSettings(element, defaultSettings) {
  // If element has animation attributes, skip template processing
  if (hasAnimationAttributes(element)) {
    return null;
  }

  // Get template settings if available
  const templateSettings = getElementTemplateSettings(element);
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