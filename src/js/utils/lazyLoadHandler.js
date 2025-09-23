export function handleLazyLoadedImages(ScrollTrigger, config = {}) {
  const {
    lazy = true,
    timeout = 0.5,
    forceEagerAboveViewport = true,
    excludeNavTriggers = true
  } = config;

  // Selective refresh function that excludes nav triggers
  const refreshScrollTriggers = () => {
    if (excludeNavTriggers) {
      ScrollTrigger.getAll().forEach(st => {
        const trigger = st.vars.trigger;
        if (!trigger || typeof trigger.hasAttribute !== "function" || !trigger.hasAttribute('aa-nav')) {
          st.refresh();
        }
      });
    } else {
      ScrollTrigger.refresh();
    }
  };

  // Get all lazy images using GSAP's utility
  const lazyImages = gsap.utils.toArray("img[loading='lazy']");
  if (!lazyImages.length) return;

  // Force load images above viewport if enabled
  if (forceEagerAboveViewport && window.scrollY > 0) {
    const scrollTop = window.scrollY;
    lazyImages.forEach(img => {
      const rect = img.getBoundingClientRect();
      const absoluteTop = rect.top + scrollTop;
      if (absoluteTop < scrollTop) {
        img.loading = 'eager';
      }
    });
  }

  // Set up throttled refresh using GSAP's delayedCall
  const refreshTimeout = gsap.delayedCall(timeout, refreshScrollTriggers).pause();
  let imgLoaded = lazyImages.length;

  const onImgLoad = () => {
    if (lazy) {
      // Restart the timeout - this throttles multiple rapid loads
      refreshTimeout.restart(true);
    } else {
      // Immediate refresh when all images loaded
      --imgLoaded || refreshScrollTriggers();
    }
  };

  // Process each image
  lazyImages.forEach(img => {
    // Convert to eager loading if lazy is false
    if (!lazy) {
      img.loading = "eager";
    }
    
    // Check if already loaded or add load listener
    img.naturalWidth ? onImgLoad() : img.addEventListener("load", onImgLoad, { once: true });
  });
} 