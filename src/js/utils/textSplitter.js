export function splitText(element, split, hideFromScreenReaders = false, onSplit) {
  // Parse split value for random/grouping
  const [splitType, randomMode] = split?.split('|') || [];
  
  // Define a mapping of split to SplitText options
  const splitMap = {
    'lines&words': { type: 'words,lines' },
    'lines&chars': { type: 'chars,lines' },
    'chars': { type: 'chars,lines' },
    'words': { type: 'words,lines' },
    'lines': { type: 'lines' }
  };

  // Find the first matching type or default to 'lines'
  const splitConfig = Object.entries(splitMap).find(([key]) => splitType?.startsWith(key))?.[1] || splitMap.lines;
  
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
      // Handle random/grouped splits
      if (randomMode) {
        // Get the base split type without any modifiers
        const baseSplitType = splitType.split('-')[0]; // Remove any suffixes like -clip
        const elements = self[baseSplitType];
        
        // Shuffle the elements (needed for both random and grouped modes)
        for (let i = elements.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [elements[i], elements[j]] = [elements[j], elements[i]];
        }

        // If we have a number, create groups
        if (!isNaN(parseInt(randomMode))) {
          const steps = parseInt(randomMode);
          const elementsPerStep = Math.ceil(elements.length / steps);
          
          // Create and fill groups in one pass
          self._groups = Array.from({ length: steps }, (_, stepIndex) => 
            elements.slice(stepIndex * elementsPerStep, (stepIndex + 1) * elementsPerStep)
          );
        }
      }
      
      const timeline = onSplit(self);
      self.timeline = timeline; // Store the timeline on the SplitText instance
      return timeline;
    };
  }
  
  // Split the text using GSAP SplitText
  let splitInstance = new SplitText(element, splitConfig);

  return { splitInstance }; // Only return the SplitText instance for cleanup
}
