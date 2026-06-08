/**
 * Watch an element's box width and run `onChange` when it changes to a non-zero
 * value. Built on ResizeObserver, so it fires for the causes a window 'resize'
 * listener misses:
 *
 *   - **reveal from hidden** (a modal opens, a tab activates, `display:none` →
 *     block): the box goes `0 → laid-out`. This is the one case that strands
 *     measure-at-init components — a slider whose widths were all `0` because it
 *     was inside a closed modal stays broken until the user resizes the window.
 *   - **content growth** (lazy images, late web fonts, responsive item widths)
 *     that resizes the box with no window resize.
 *
 * It also fires on viewport resize (the element's width tracks it), so a
 * consumer can drop its window 'resize' subscription and let this be the single
 * re-measure signal. Debounced; no-op fires (same width) and transitions *into*
 * hidden (`width === 0`) are dropped without calling `onChange`. Returns a
 * disposer. No-op where ResizeObserver is unavailable (SSR).
 */
export function observeSize(
  element: Element,
  onChange: () => void,
  { debounce = 150 }: { debounce?: number } = {},
): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {}
  let lastWidth = element.getBoundingClientRect().width
  let timer: ReturnType<typeof setTimeout> | undefined
  const ro = new ResizeObserver(() => {
    const width = element.getBoundingClientRect().width
    if (width === lastWidth) return
    lastWidth = width
    if (width === 0) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(onChange, debounce)
  })
  ro.observe(element)
  return () => {
    if (timer) clearTimeout(timer)
    ro.disconnect()
  }
}
