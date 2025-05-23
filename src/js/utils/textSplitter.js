export function splitText(element, split, hideFromScreenReaders = false, onSplit) {
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
  
  // Set aria handling based on hideFromScreenReaders - used for duplicate elements
  splitConfig.aria = hideFromScreenReaders ? 'hidden' : 'auto';
  
  // Check for mask type in animation
  const animationType = element.settings?.animationType || '';
  const maskTypes = ['-clip', '-lines', '-words', '-chars'];
  const maskType = maskTypes.find(type => animationType.includes(type));
  
  // Enable masking if needed
  if (maskType) {
    // Extract the mask type from the suffix (remove the hyphen)
    const maskValue = maskType === '-clip' ? 'lines' : maskType.substring(1);
    splitConfig.mask = maskValue;
  }
  
  // Add autoSplit and onSplit options
  splitConfig.autoSplit = true;
  
  if (onSplit) {
    splitConfig.onSplit = (self) => {
      const timeline = onSplit(self);
      self.timeline = timeline; // Store the timeline on the SplitText instance
      return timeline;
    };
  }
  
  // Split the text using GSAP SplitText
  let splitInstance = new SplitText(element, splitConfig);

  return { splitInstance }; // Only return the SplitText instance for cleanup
}
