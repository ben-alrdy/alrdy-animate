import SplitType from 'split-type';

export function splitText(element, type = 'lines') {
  const isClip = type.includes('clip'); // check if clip option is included in the type
      
  // default split type is lines, checks if chars or words are included in the type
  let types = 'lines';
  if (type.includes('chars')) {
    types = 'lines, words, chars';
    type = 'chars';
  } else if (type.includes('words')) {
    types = 'lines, words';
    type = 'words';
  } else {
    type = 'lines';
  }

  // split the text into lines, words or chars
  let result = new SplitType(element, { types });

  // if clip option is included, wrap each line in a clip wrapper
  if (result.lines && isClip) {
    result.lines.forEach(line => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('line-clip-wrapper');
      line.parentNode.insertBefore(wrapper, line); // insert the wrapper before the line  
      wrapper.appendChild(line); // append the line to the wrapper
    });
  }
  
  return { 
    splitResult: result, // the result of the SplitType function
    splitType: type // the type of split (lines, words, chars), without the 'clip' option from the original attribute
  };
}
