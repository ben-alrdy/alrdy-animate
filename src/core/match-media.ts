import type { Breakpoints } from '../types/index'
import type { GsapHandle, GsapMatchMedia } from './gsap-detect'
import { resolveRanges, type BucketKey, type Config, type ResolvedAttrs } from './settings'

export interface ResponsiveBindingArgs {
  element: Element
  config: Config
  bucket: BucketKey
}

export type ResponsiveBinding = (args: ResponsiveBindingArgs) => void | (() => void)

export interface ResponsiveController {
  bind: (element: Element, attrs: ResolvedAttrs, run: ResponsiveBinding) => void
  revertAll: () => void
  /**
   * Kill all tweens and ScrollTriggers in the matchMedia *without* reverting
   * inline GSAP styles. Use only when the bound DOM is about to be removed —
   * e.g. a Barba page-transition leave hook — so leftover `opacity:0`,
   * `transform:translateY(...)` etc. linger briefly until the wrapper is
   * discarded. Calling this on a long-lived container would freeze elements
   * mid-animation indefinitely.
   */
  killAll: () => void
}

export function createResponsiveController(
  gsapHandle: GsapHandle,
  breakpoints: Breakpoints,
): ResponsiveController {
  const mm: GsapMatchMedia = gsapHandle.gsap.matchMedia()

  const bind: ResponsiveController['bind'] = (element, attrs, run) => {
    const ranges = resolveRanges(attrs.buckets, breakpoints)
    for (const { bucket, query, config } of ranges) {
      mm.add(query, () => {
        const cleanup = run({ element, config, bucket })
        return typeof cleanup === 'function' ? cleanup : undefined
      })
    }
  }

  const revertAll = (): void => {
    mm.revert()
  }

  const killAll = (): void => {
    mm.kill()
  }

  return { bind, revertAll, killAll }
}
