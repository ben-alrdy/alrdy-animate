import { SplitText } from 'gsap/SplitText';

export function splitText(element, split, hideFromScreenReaders = false) {
  // Define a mapping of split to SplitText options
  const splitMap = {
    'lines&words': { type: 'words,lines' },
    'lines&chars': { type: 'chars,lines' },
    'chars': { type: 'chars,lines' },
    'words': { type: 'words,lines' },
    'lines': { type: 'lines' }
  };

  // Find the first matching type or default to 'lines'
  const splitConfig = Object.entries(splitMap).find(([key]) => split?.startsWith(key))?.[1] || splitMap.lines;
  
  // Handle accessibility based on hideFromScreenReaders parameter
  if (hideFromScreenReaders) {
    // For duplicated elements, hide the entire element from screen readers
    element.setAttribute("aria-hidden", "true");
  } else {
    // For original elements, save text content for screen readers
    const originalText = element.textContent;
    element.setAttribute("aria-label", originalText);
  }
  
  // Split the text using GSAP SplitText
  let splitInstance = new SplitText(element, splitConfig);

  // Hide split elements from screen readers (only if not already hidden)
  if (!hideFromScreenReaders) {
    // We only need to hide the top-level elements (lines) since aria-hidden propagates to descendants
    if (splitInstance.lines) {
      splitInstance.lines.forEach(line => line.setAttribute("aria-hidden", "true"));
    } else if (splitInstance.words) {
      splitInstance.words.forEach(word => word.setAttribute("aria-hidden", "true"));
    } else if (splitInstance.chars) {
      splitInstance.chars.forEach(char => char.setAttribute("aria-hidden", "true"));
    }
  }

  // Check if animation type includes 'clip'
  const isClipped = (element.settings?.animationType?.includes('-clip') || 
                   element.getAttribute('aa-animate')?.includes('-clip')) ?? false;
  
  // Add clip wrappers if needed
  if (isClipped && splitInstance.lines) {
    splitInstance.lines.forEach(line => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('line-clip-wrapper');
      line.parentNode.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    });
  }

  return {
    splitElements: {
      lines: splitInstance.lines || [],
      words: splitInstance.words || [],
      chars: splitInstance.chars || []
    },
    splitInstance  // Return the actual SplitText instance for cleanup
  };
}
