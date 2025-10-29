export function handleLazyLoadedImages(ScrollTrigger, config = {}) {
  const {
    lazy = true,
    timeout = 0.5,
    maxWait = 2.0,
    forceEagerAboveViewport = true,
    forceEagerAfterDelay = 3, // Set to number (e.g., 3) to force all images to eager after X seconds
    excludeNavTriggers = true,
    debug = false
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
  let imgLoaded = lazyImages.length;
  let firstLoadTime = null;
  
  const refreshTimeout = gsap.delayedCall(timeout, () => {
    refreshScrollTriggers();
    firstLoadTime = null; // Reset timer after successful debounced refresh
  }).pause();

  const onImgLoad = () => {
    if (lazy) {
      const now = Date.now();
      
      // Track when the first image started loading
      if (!firstLoadTime) {
        firstLoadTime = now;
      }
      
      // Check if we've exceeded maxWait time
      const elapsedTime = (now - firstLoadTime) / 1000;
      
      if (elapsedTime >= maxWait) {
        // Force refresh and reset timer
        refreshScrollTriggers();
        firstLoadTime = null;
      } else {
        // Normal debounce behavior - restart the timeout
        refreshTimeout.restart(true);
      }
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

  // Force all remaining lazy images to eager after delay
  if (forceEagerAfterDelay && forceEagerAfterDelay > 0) {
    gsap.delayedCall(forceEagerAfterDelay, () => {
      // Find all lazy images again (some may have loaded already)
      const remainingLazyImages = gsap.utils.toArray("img[loading='lazy']");
      
      if (remainingLazyImages.length > 0) {
        if (debug) {
          console.log(`AlrdyAnimate: Converting ${remainingLazyImages.length} remaining lazy images to eager after ${forceEagerAfterDelay}s`);
        }
        
        let remainingCount = remainingLazyImages.length;
        
        const onDelayedImgLoad = () => {
          if (--remainingCount === 0) {
            // All delayed images loaded, refresh ScrollTrigger
            refreshScrollTriggers();
          }
        };
        
        remainingLazyImages.forEach(img => {
          // Convert to eager
          img.loading = "eager";
          
          // Check if already loaded or add load listener
          img.naturalWidth ? onDelayedImgLoad() : img.addEventListener("load", onDelayedImgLoad, { once: true });
        });
      }
    });
  }
} 