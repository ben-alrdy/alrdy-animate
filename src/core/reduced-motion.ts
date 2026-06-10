import type { ReducedMotionOptions, ResolvedOptions } from '../types/index'
import type { GsapHandle } from './gsap-detect'
import { parseNum, parseScrub } from './parse'
import { resolveAnimateValue, type ResolvedPreset } from './presets'
import { classifyAnimateValue, type FeatureName } from './scanner'
import { resolveScrollStart } from './scroll-trigger'
import { onCustomTrigger, resolveTriggers } from './trigger'

/**
 * Single global fade-fallback pass. Whichever conditions trigger it
 * (`reducedMotion` OS preference, or `optimizeMobile` viewport check), the
 * mechanism is the same: bypass per-feature matchMedia binding, SplitText
 * runtime, slice-panel DOM, and clip-path tweening — replace every targeted
 * decorative element with a single opacity tween.
 *
 * The caller decides WHICH features get replaced via two complementary sets
 * passed into the pass:
 *   - `featuresToReplace` — feature modules that will NOT be loaded
 *   - `fadeFor` — subset of those whose elements should still get a fade
 *
 * Examples:
 *   reducedMotion active:
 *     featuresToReplace = {appear, text, reveal, hover, parallax}
 *     fadeFor           = {appear, text, reveal}        // hover + parallax stay still
 *
 *   optimizeMobile + small viewport:
 *     featuresToReplace = {text, parallax, split}
 *     fadeFor           = {text}                        // parallax stays still
 *
 * Cost shape vs. normal motion:
 *   normal           → N modules imported · M matchMedia contexts · split DOM mutations
 *   fade-fallback    → 0 replaced modules · M plain gsap tweens · 0 DOM mutations
 */

export interface FadeFallbackDeps {
  gsap: GsapHandle
  options: ResolvedOptions
  reducedMotion: ReducedMotionOptions
  firstInit: boolean
  /**
   * Set of feature names whose elements should be processed by this fade
   * pass. Other elements are ignored even if they're in the `elements`
   * array — they belong to features that are still loading normally.
   */
  fadeFor: ReadonlySet<FeatureName>
  /**
   * Class → preset resolution. Lets the fade pass look up `aa-animate` for
   * preset elements that have no real attribute on them. Pass an empty map
   * when no `presets` option was set.
   */
  presetMap: Map<Element, ResolvedPreset>
  /**
   * Same paint-gated load-start hook as `FeatureContext.deferLoadStart`. The
   * fade pass's `load` entrances are built `paused` and released here so they
   * don't advance during the post-init paint block, matching the main path.
   */
  deferLoadStart: (release: () => void) => void
}

/**
 * Run the fade-fallback pass. Returns a disposer that reverts every tween +
 * listener created here.
 */
export function runFadeFallbackPass(
  elements: Element[],
  deps: FadeFallbackDeps,
): () => void {
  const { gsap: gsapHandle, options, reducedMotion, firstInit, fadeFor, presetMap, deferLoadStart } =
    deps
  const { duration, ease } = reducedMotion
  const fromState = { opacity: 0 } as const
  const toState = { opacity: 1 } as const
  const listenerDisposers: Array<() => void> = []

  // Same precedence as everywhere else: real attribute wins, preset map fills
  // holes. Lets preset elements participate in the fade-fallback pass.
  const getAttr = (element: Element, name: string): string | null => {
    const real = element.getAttribute(name)
    if (real !== null) return real
    return presetMap.get(element)?.get(name) ?? null
  }

  // gsap.context() captures every tween + ScrollTrigger created inside it,
  // so a single ctx.revert() at destroy time cleans up the whole pass.
  // Custom event listeners (aa-trigger="event:...") are tracked separately.
  const gsapCtx = gsapHandle.gsap.context(() => {
    for (const element of elements) {
      const animateValue = resolveAnimateValue(element, presetMap)
      if (!animateValue) continue
      const classified = classifyAnimateValue(animateValue)
      if (!fadeFor.has(classified)) continue

      const delay = parseNum(getAttr(element, 'aa-delay'), 0)
      const scrollEnd = getAttr(element, 'aa-scroll-end') ?? options.scrollEnd
      const scrub = parseScrub(getAttr(element, 'aa-scrub'))
      const scrollStart = resolveScrollStart(
        getAttr(element, 'aa-scroll-start') ?? undefined,
        options,
        scrub,
      )
      const triggers = resolveTriggers(
        element,
        getAttr(element, 'aa-trigger') ?? undefined,
        options.breakpoints,
      )
      const hasLoadOnce = triggers.some((t) => t.kind === 'load-once')
      const hasLoad = triggers.some((t) => t.kind === 'load')

      if ((hasLoadOnce && firstInit) || hasLoad) {
        // aa-fallback signals the inline-snippet timeout already faded the
        // element in via CSS; running our tween now would rewind it through
        // the from-state and flash. The end-of-init aa-ready flip still
        // happens, keeping DOM consistent.
        if (document.documentElement.hasAttribute('aa-fallback')) continue
        // Built `paused` and released after first paint (same rationale as the
        // main triggered path) — keeps the fade from advancing during the
        // post-init paint block. `restart(true)` honors the full delay.
        const tween = gsapHandle.gsap.fromTo(element, fromState, {
          ...toState,
          duration,
          ease,
          delay: delay + options.loadDelay,
          paused: true,
        })
        deferLoadStart(() => tween.restart(true))
        continue
      }

      const trigger = triggers.find((t) => t.kind !== 'load-once' && t.kind !== 'load')
      if (!trigger) continue

      if (trigger.kind === 'event' && trigger.eventName) {
        gsapHandle.gsap.set(element, fromState)
        const eventName = trigger.eventName
        const off = onCustomTrigger((target, name) => {
          if (name !== eventName) return
          if (target !== element && !target.contains(element)) return
          gsapHandle.gsap.to(element, { ...toState, duration, ease, delay })
        })
        listenerDisposers.push(off)
        continue
      }

      if (scrub !== undefined) {
        gsapHandle.gsap.fromTo(element, fromState, {
          ...toState,
          duration,
          ease,
          delay,
          scrollTrigger: {
            trigger: element,
            start: scrollStart,
            end: scrollEnd,
            scrub,
          },
        })
        continue
      }

      gsapHandle.gsap.fromTo(element, fromState, {
        ...toState,
        duration,
        ease,
        delay,
        scrollTrigger: {
          trigger: element,
          start: scrollStart,
          // No end / again handling — fade-fallback already minimises motion;
          // a single play on enter is the calmest read.
          toggleActions: 'play none none none',
        },
      })
    }
  })

  return () => {
    for (const off of listenerDisposers) {
      try {
        off()
      } catch {
        // ignore
      }
    }
    try {
      gsapCtx.revert()
    } catch {
      // ignore — pre-destroyed or partial init
    }
  }
}

/**
 * Decorative feature modules that `reducedMotion: true` replaces with the
 * unified fade pass when the OS reports `(prefers-reduced-motion: reduce)`.
 */
export const REDUCED_MOTION_REPLACED_FEATURES: ReadonlySet<FeatureName> = new Set([
  'appear',
  'text',
  'reveal',
  'parallax',
  'hover',
])

/**
 * Subset of `REDUCED_MOTION_REPLACED_FEATURES` whose elements still get a
 * fade. Hover and parallax are no-ops under reduced motion (no fade — they
 * just don't animate).
 */
export const REDUCED_MOTION_FADE_FEATURES: ReadonlySet<FeatureName> = new Set([
  'appear',
  'text',
  'reveal',
])

/**
 * The heaviest features for mobile: SplitText-driven text animations,
 * continuously-repainting parallax, and the standalone aa-split utility
 * (which also pulls in SplitText). Triggered by `optimizeMobile: true` when
 * the viewport is below `breakpoints.md`.
 */
export const OPTIMIZE_MOBILE_REPLACED_FEATURES: ReadonlySet<FeatureName> = new Set([
  'text',
  'parallax',
  'split',
])

/**
 * Subset of `OPTIMIZE_MOBILE_REPLACED_FEATURES` whose elements still get a
 * fade. Parallax stays still (no transform); aa-split is a utility, not an
 * animation, so its elements get nothing.
 */
export const OPTIMIZE_MOBILE_FADE_FEATURES: ReadonlySet<FeatureName> = new Set([
  'text',
])
