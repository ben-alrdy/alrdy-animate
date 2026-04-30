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

  return { bind, revertAll }
}
