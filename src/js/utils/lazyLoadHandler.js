import { debounce } from './shared';

export function handleLazyLoadedImages(ScrollTrigger) {
  let needsRefresh = false;

  const debouncedRefresh = debounce(() => {
    if (ScrollTrigger && needsRefresh) {
      ScrollTrigger.refresh();
      needsRefresh = false;
    }
  }, 200);

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