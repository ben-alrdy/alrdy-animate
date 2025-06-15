// Predefined animation themes
const predefinedThemes = {
  'blur': {
    'heading-style-h2': {
      animationType: 'text-blur',
      split: 'chars|3',
      ease: 'power1.out',
      duration: 0.8,
      stagger: 0.1
    },
    'heading-style-h3': {
      animationType: 'text-blur',
      split: 'words',
      ease: 'power1.out',
      duration: 0.6,
      stagger: 0.08
    },
    'text-size-medium': {
      animationType: 'text-fade',
      split: 'lines&words',
      ease: 'power2.out',
      duration: 1,
      stagger: 0.02
    }
  },
  'tilt': {
    'heading-style-h2': {
      animationType: 'text-tilt-up-lines',
      split: 'lines',
      ease: 'power4.out',
      duration: 0.9,
      stagger: 0.1,
    },
    'heading-style-h3': {
      animationType: 'text-tilt-up-lines',
      split: 'lines',
      ease: 'power4.out',
      duration: 0.7,
      stagger: 0.1,
    },
    'text-size-medium': {
      animationType: 'text-slide-up-lines',
      split: 'lines',
      ease: 'power4.out',
      duration: 0.5,
      stagger: 0.02,
    }
  }
};

// Store for custom themes
let customThemes = {};


/**
 * Get a theme by name
 * @param {string} name - Theme name
 * @returns {Object|null} Theme configuration or null if not found
 */
export function getTheme(name) {
  return customThemes[name] || predefinedThemes[name] || null;
}

/**
 * Clear all custom themes
 */
export function clearCustomThemes() {
  customThemes = {};
}

// Export predefined themes for reference
export const themes = predefinedThemes; 