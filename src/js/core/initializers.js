// Core initialization functions for AlrdyAnimate

export function initializeScrollState() {
  let lastScrollTop = 0;
  const threshold = 20;
  const thresholdTop = 50;
  let ticking = false;

  // Check initial scroll position
  requestAnimationFrame(() => {
    const currentScrollTop = window.scrollY;
    if (currentScrollTop > thresholdTop) {
      document.body.setAttribute('data-scroll-direction', 'down');
      document.body.setAttribute('data-scroll-started', currentScrollTop > thresholdTop ? 'true' : 'false');
    }
  });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScrollTop = window.scrollY;
        const delta = Math.abs(currentScrollTop - lastScrollTop);
        
        // Only process if we've scrolled more than the threshold
        if (delta >= threshold) {
          const direction = currentScrollTop > lastScrollTop ? 'down' : 'up';
          const hasScrolled = currentScrollTop > thresholdTop;
          
          // Update body attributes for global state
          document.body.setAttribute('data-scroll-direction', direction);
          document.body.setAttribute('data-scroll-started', hasScrolled ? 'true' : 'false');
          
          lastScrollTop = currentScrollTop;
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  }, { passive: true });
}

// Play state observer
export function initializePlayStateObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const element = entry.target;
      // Get all children and filter those that have animations
      const children = element.children;
      
      Array.from(children).forEach(child => {
        const animations = child.getAnimations();
        if (animations.length > 0) {
          animations.forEach(animation => {
            if (entry.isIntersecting) {
              animation.play();
            } else {
              animation.pause();
            }
          });
        }
      });
    });
  });

  // Observe all containers with the attribute
  document.querySelectorAll('[aa-toggle-playstate]').forEach(element => {
    observer.observe(element);
  });
} 