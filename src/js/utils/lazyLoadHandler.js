import { debounce } from './shared';

export function handleLazyLoadedImages(ScrollTrigger) {
  let needsRefresh = false;
  let forceLoadExecuted = false;

  const debouncedRefresh = debounce(() => {
    if (ScrollTrigger && needsRefresh) {
      ScrollTrigger.refresh();
      needsRefresh = false;
    }
  }, 200);

  // Force load images above viewport
  const forceLoadAboveImages = () => {
    if (forceLoadExecuted) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    let eagerLoadCount = 0;
    let loadedCount = 0;
    
    lazyImages.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const absoluteTop = rect.top + scrollTop;
      
      if (absoluteTop < scrollTop) {
        eagerLoadCount++;
        if (!img.complete) {
          img.addEventListener('load', () => {
            loadedCount++;
            if (loadedCount === eagerLoadCount) {
              ScrollTrigger.refresh(true);
            }
          }, { once: true });
        } else {
          loadedCount++;
        }
        img.loading = 'eager';
      }
    });

    // If all eager images were already loaded
    if (eagerLoadCount > 0 && loadedCount === eagerLoadCount) {
      ScrollTrigger.refresh(true);
    }

    forceLoadExecuted = true;
  };

  // Call immediately if page is scrolled
  if (window.scrollY > 0) {
    forceLoadAboveImages();
  }

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  lazyImages.forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', () => {
        needsRefresh = true;
      }, { once: true });
    }
  });

  ScrollTrigger.addEventListener('scrollEnd', () => {
    if (needsRefresh) {
      debouncedRefresh();
    }
  });
} 