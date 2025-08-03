// Core initialization functions for AlrdyAnimate

export function initializeScrollState() {
  let lastScrollTop = 0;
  let lastScrollDirection = null;
  let lastScrollStarted = null;
  const threshold = 5;
  const thresholdTop = 50;
  let ticking = false;

  // Check initial scroll position
  requestAnimationFrame(() => {
    if (!document.body.hasAttribute('data-scroll-direction')) {
      document.body.setAttribute('data-scroll-direction', 'down');
      lastScrollDirection = 'down';
    } else {
      lastScrollDirection = document.body.getAttribute('data-scroll-direction');
    }
    
    const currentScrollTop = window.scrollY;
    const scrollStarted = currentScrollTop > thresholdTop ? 'true' : 'false';
    document.body.setAttribute('data-scroll-started', scrollStarted);
    lastScrollStarted = scrollStarted;
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
          const scrollStarted = hasScrolled ? 'true' : 'false';
          
          // Only update attributes if they've changed
          if (direction !== lastScrollDirection) {
            document.body.setAttribute('data-scroll-direction', direction);
            lastScrollDirection = direction;
          }
          
          if (scrollStarted !== lastScrollStarted) {
            document.body.setAttribute('data-scroll-started', scrollStarted);
            lastScrollStarted = scrollStarted;
          }
          
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