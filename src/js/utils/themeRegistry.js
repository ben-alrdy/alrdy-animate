// Predefined animation themes
const predefinedThemes = {
  'floaty-fade': {
    'headline-style-h1': {
      animationType: 'text-float-up',
      split: 'lines',
      ease: 'circ.out',
      duration: 1.2,
      stagger: 0.2
    },
    'headline-style-h2': {
      animationType: 'text-fade',
      split: 'words',
      ease: 'power2.out',
      duration: 0.6,
      stagger: 0.04
    },
    'headline-style-h3': {
      animationType: 'text-slide-up',
      split: 'words',
      ease: 'power2.out',
      duration: 0.5,
      stagger: 0.03
    },
    'paragraph-style-normal': {
      animationType: 'aa-fade-up',
      ease: 'power2.out',
      duration: 0.7
    }
  },
  'bouncy': {
    'headline-style-h1': {
      animationType: 'text-slide-up|aa-fade-up',
      split: 'words',
      ease: 'power2.out',
      duration: 1,
      stagger: 0.1
    },
    'headline-style-h2': {
      animationType: 'text-slide-up',
      split: 'words',
      ease: 'power2.out',
      duration: 0.8,
      stagger: 0.08
    },
    'headline-style-h3': {
      animationType: 'text-slide-up',
      split: 'words',
      ease: 'power2.out',
      duration: 0.6,
      stagger: 0.06
    },
    'paragraph-style-normal': {
      animationType: 'aa-fade-up',
      ease: 'power2.out',
      duration: 0.9,
      delay: 0.3
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