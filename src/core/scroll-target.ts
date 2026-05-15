/**
 * Click-to-scroll handler for `[aa-scroll-target]` elements.
 *
 * Always installed at init() time, regardless of smoothScroll setting:
 *
 * - If `window.lenis` exists at click time, scroll via Lenis with the v7
 *   quartic easing for parity with existing alrdy projects.
 * - Otherwise fall back to native `window.scrollTo({ behavior: 'smooth' })`,
 *   which still honours the `aa-distance` offset.
 *
 * Per-element listeners (not delegated) so we can `preventDefault()` the
 * anchor click cleanly and remove them all on destroy.
 */

import { parseNum } from './parse'

const QUART_EASE = (x: number): number =>
  x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2

const DEFAULT_DURATION = 1.2

export function initScrollTarget(): () => void {
  if (typeof window === 'undefined') return () => {}

  const elements = document.querySelectorAll<HTMLElement>('[aa-scroll-target]')
  if (elements.length === 0) return () => {}

  const listeners: Array<{ el: HTMLElement; fn: (e: Event) => void }> = []

  for (const el of elements) {
    const fn = (e: Event): void => {
      const targetSelector = el.getAttribute('aa-scroll-target')
      if (!targetSelector) return
      const target = document.querySelector(targetSelector)
      if (!target) return
      e.preventDefault()
      const duration = parseNum(el.getAttribute('aa-duration'), DEFAULT_DURATION)
      const offset = parseNum(el.getAttribute('aa-distance'), 0)
      const lenis = window.lenis
      if (lenis) {
        lenis.scrollTo(targetSelector, { offset, duration, easing: QUART_EASE })
        return
      }
      const top = (target as HTMLElement).getBoundingClientRect().top + window.scrollY + offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
    el.addEventListener('click', fn)
    listeners.push({ el, fn })
  }

  return () => {
    for (const { el, fn } of listeners) el.removeEventListener('click', fn)
  }
}
