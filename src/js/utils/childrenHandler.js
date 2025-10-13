export function processChildren(element) {
  const children = Array.from(element.children);
  const parentDelay = element.hasAttribute("aa-delay") ? parseFloat(element.getAttribute("aa-delay")) : 0;
  const stagger = element.hasAttribute("aa-stagger") ? parseFloat(element.getAttribute("aa-stagger")) : 0;
  const animationType = element.getAttribute("aa-children");

  children.forEach((child, index) => {
    if (child.hasAttribute("aa-animate")) return;

    if (animationType && animationType !== "true") {
      child.setAttribute("aa-animate", animationType);
    }

    // Copy attributes into child
    Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aa-') && 
                     !['aa-children', 'aa-stagger', 'aa-delay', 'aa-accordion', 'aa-modal', 'aa-hover', 'aa-slider', 'aa-marquee', 'aa-nav'].includes(attr.name))
      .forEach(attr => {
        child.setAttribute(attr.name, attr.value);
      });

    // Calculate and set staggered delay
    const childDelay = parentDelay + (index * stagger);
    child.setAttribute("aa-delay", childDelay.toString());
  });

  element.style.opacity = '1'; // Make parent visible after processing children
  
  return children;
} 