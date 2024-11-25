import SplitType from 'split-type';

export function splitText(element, type) {
  // Define a mapping of type to SplitType options
  const typeMap = {
    'lines&words': { types: 'lines, words', splitType: 'lines&words' },
    'chars': { types: 'lines, chars', splitType: 'chars' },
    'words': { types: 'lines, words', splitType: 'words' },
    'lines': { types: 'lines', splitType: 'lines' }
  };

  // Find the first matching type or default to 'lines'
  const { types, splitType } = Object.entries(typeMap).find(([key]) => type.startsWith(key))?.[1] || typeMap.lines;

  // split the text into lines, words or chars
  let result = new SplitType(element, { types });

  // if clip option is included, wrap each line in a clip wrapper
  if (result.lines && type.includes('clip')) {
    result.lines.forEach(line => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('line-clip-wrapper');
      line.parentNode.insertBefore(wrapper, line); // insert the wrapper before the line  
      wrapper.appendChild(line); // append the line to the wrapper
    });
  }
  return { 
    splitResult: result, // the result of the SplitType function
    splitType: splitType // the type of split (lines, words, chars), without the 'clip' option from the original attribute
  };
}
