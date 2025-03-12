import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

export function splitText(element, split) {
  // Define a mapping of split to SplitText options
  const splitMap = {
    'lines&words': { type: 'words,lines' },
    'chars': { type: 'chars,words,lines' },
    'words': { type: 'words,lines' },
    'lines': { type: 'lines' }
  };

  // Find the first matching type or default to 'lines'
  const splitConfig = Object.entries(splitMap).find(([key]) => split?.startsWith(key))?.[1] || splitMap.lines;
  
  // Split the text using GSAP SplitText
  let splitInstance = new SplitText(element, splitConfig);

  // Check if animation type includes 'clip'
  const isClipped = element.settings?.animationType?.includes('-clip') || 
                   element.getAttribute('aa-animate')?.includes('-clip');
  
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
