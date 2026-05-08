import type { SmoothScrollOptions } from '../types/index'
import type { GsapHandle } from '../core/gsap-detect'

interface LenisInstance {
  raf: (time: number) => void
  on: (event: 'scroll', cb: () => void) => void
  destroy: () => void
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number; easing?: (t: number) => number },
  ) => void
  start: () => void
  stop: () => void
}

interface LenisCtor {
  new (options?: Record<string, unknown>): LenisInstance
}

interface ScrollTriggerLike {
  update: () => void
}

declare global {
  interface Window {
    Lenis?: LenisCtor
    lenis?: LenisInstance
  }
}

const DEFAULT_OPTIONS: Required<SmoothScrollOptions> = {
  lerp: 0.12,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  smoothWheel: true,
  syncTouch: false,
}

export interface SmoothScrollHandle {
  lenis: LenisInstance
  dispose: () => void
}

export function initSmoothScroll(
  gsapHandle: GsapHandle,
  options: SmoothScrollOptions | true,
  debug: boolean,
): SmoothScrollHandle | null {
  const Lenis = typeof window !== 'undefined' ? window.Lenis : undefined
  if (!Lenis) {
    if (debug) {
      console.warn(
        '[alrdy-animate] window.Lenis not found — smooth scroll disabled. Add <script src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script> before alrdy-animate, or pass smoothScroll: false to silence this warning.',
      )
    }
    return null
  }

  const userOpts = options === true ? {} : options
  const merged = { ...DEFAULT_OPTIONS, ...userOpts }
  const lenis = new Lenis(merged as unknown as Record<string, unknown>)

  const ScrollTrigger = (gsapHandle.plugins.ScrollTrigger as ScrollTriggerLike | undefined)
  const updateScrollTrigger = ScrollTrigger ? () => ScrollTrigger.update() : null
  if (updateScrollTrigger) lenis.on('scroll', updateScrollTrigger)

  const tickerFn = (time: number): void => {
    lenis.raf(time * 1000)
  }
  gsapHandle.gsap.ticker.add(tickerFn)
  // Lenis manages its own time; lag smoothing causes jumps at frame drops.
  gsapHandle.gsap.ticker.lagSmoothing(0)

  window.lenis = lenis

  const dispose = (): void => {
    gsapHandle.gsap.ticker.remove(tickerFn)
    try {
      lenis.destroy()
    } catch (err) {
      if (debug) console.warn('[alrdy-animate] lenis.destroy() threw', err)
    }
    if (window.lenis === lenis) delete window.lenis
  }

  return { lenis, dispose }
}
