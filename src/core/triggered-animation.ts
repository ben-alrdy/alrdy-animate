import type { GsapTween } from './gsap-detect'
import type { FeatureContext } from './registry'
import { bindAgainTrigger } from './scroll-trigger'
import {
  type ParsedTrigger,
  REVERSE_EASE,
  REVERSE_TIME_SCALE,
  subscribeWithPair,
} from './trigger'

/**
 * Vars the orchestrator hands to the feature's `buildAnimation` callback.
 * The shape encodes the trigger classification — the feature just plugs the
 * vars into its `gsap.from(...)` / `gsap.fromTo(...)` / `gsap.timeline(...)`
 * call and the right trigger semantics fall out.
 *
 *   load-once / load             { delay }                         — plays immediately
 *   event                        { paused: true, delay, defaults } — paused, controlled by event pair
 *   scrub                        { delay, scrollTrigger }          — bound to scroll position
 *   scroll-again (the default)   { paused: true, delay }           — paused, controlled by enter/reset triggers
 */
export interface TriggerVars {
  paused?: boolean
  delay: number
  defaults?: { easeReverse: number | string }
  scrollTrigger?: {
    trigger: Element
    start: string
    end: string | undefined
    scrub: number | true
  }
}

export interface BuiltAnimation {
  animation: GsapTween
  /** Optional cleanup for feature-specific DOM mutations (line wrappers etc.) — runs before rebuild and on dispose. */
  cleanup?: () => void
}

export interface TriggeredAnimationOptions {
  /**
   * Pre-parsed triggers — the feature decides whether to use
   * `resolveTriggers` (with container inference for slider/tabs/modal) or
   * the bare `parseTriggers`. Passing the result keeps the helper agnostic.
   */
  triggers: ParsedTrigger[]
  delay: number
  scrollStart: string
  scrollEnd: string | undefined
  /** When set, the helper builds a scrub-mode animation regardless of trigger kind. */
  scrub: number | true | undefined
  /** Scroll-again behaviour from `init({ again })`. */
  again: boolean
  /** ScrollTrigger anchor override (e.g. `aa-anchor`). Defaults to the animated element. */
  triggerEl?: Element
  /**
   * Build the GSAP tween / timeline given the trigger-determined vars.
   *
   * Called once at setup and again on every `handle.rebuild()` — text
   * features call this after SplitText resplits to retarget the new
   * `.aa-char` / `.aa-line` nodes. Return null to skip (empty inputs,
   * unsupported config).
   */
  buildAnimation: (vars: TriggerVars) => BuiltAnimation | null
}

export interface TriggeredAnimationHandle {
  /**
   * Recreate the animation against the current state. Trigger machinery
   * stays attached; rebuilt animations are wired up via closures.
   *
   * No-op for load-once / load after the first fire — their "play once on
   * this init cycle" semantic shouldn't re-fire on resize-driven rebuilds.
   *
   * When the trigger pair is currently in its played state (event forward
   * fired, no reverse since; or scroll-again past start, no full leave-back
   * since), the new animation is snapped to `progress(1).pause()` so
   * already-visible content doesn't flash back through the from-state.
   */
  rebuild: () => void
  /** Tear down triggers, animation, and any feature cleanup. */
  dispose: () => void
}

/**
 * Lifts trigger orchestration out of animation features. The feature
 * declares what to animate (in `buildAnimation`); this helper decides when
 * and how to play it based on the parsed `aa-trigger`.
 *
 * Returns `null` when nothing should run (e.g. `aa-trigger="load-once"` on a
 * subsequent init cycle — load already fired). Returns a handle with
 * `rebuild()` for features that need to re-target their animation against
 * fresh DOM (SplitText auto-resplit on resize is the canonical case).
 */
export function setupTriggeredAnimation(
  ctx: FeatureContext,
  element: Element,
  opts: TriggeredAnimationOptions,
): TriggeredAnimationHandle | null {
  const hasLoadOnce = opts.triggers.some((t) => t.kind === 'load-once')
  const hasLoad = opts.triggers.some((t) => t.kind === 'load')
  const isLoadOneShot = (hasLoadOnce && ctx.firstInit) || hasLoad
  let persistentTrigger: ParsedTrigger | undefined
  if (!isLoadOneShot) {
    persistentTrigger = opts.triggers.find(
      (t) => t.kind !== 'load-once' && t.kind !== 'load',
    )
  }
  // No firing trigger at all (e.g. `aa-trigger="load-once"` on a subsequent
  // init, after the load already played). The end-of-init aa-ready flip will
  // reveal the element in its natural state.
  if (!isLoadOneShot && !persistentTrigger) return null

  const triggerEl = opts.triggerEl ?? element

  // Stagger load-triggered entrances after init() settles so the first frame
  // isn't a hard jump from the from-state. Per-element `aa-delay` still
  // composes on top — set both and they add. The `aa-fallback` skip above
  // already short-circuits the load branch on slow-load revisits, so we don't
  // need to gate the addition itself on that attribute.
  const loadDelay = isLoadOneShot ? opts.delay + ctx.options.loadDelay : opts.delay

  let currentAnim: GsapTween | null = null
  let currentExtraCleanup: (() => void) | undefined
  let triggerPlayed = false
  let loadFired = false

  const killCurrent = (): void => {
    if (currentExtraCleanup) {
      try {
        currentExtraCleanup()
      } catch {
        // ignore
      }
      currentExtraCleanup = undefined
    }
    if (currentAnim) {
      // For animations carrying their own scrollTrigger (scrub) this also
      // kills the attached ScrollTrigger — no separate cleanup needed.
      currentAnim.kill()
      currentAnim = null
    }
  }

  const buildVars = (): TriggerVars => {
    if (isLoadOneShot) return { delay: loadDelay }
    if (persistentTrigger?.kind === 'event') {
      return {
        paused: true,
        delay: opts.delay,
        defaults: { easeReverse: REVERSE_EASE },
      }
    }
    if (opts.scrub !== undefined) {
      return {
        delay: opts.delay,
        scrollTrigger: {
          trigger: triggerEl,
          start: opts.scrollStart,
          end: opts.scrollEnd,
          scrub: opts.scrub,
        },
      }
    }
    return { paused: true, delay: opts.delay }
  }

  const rebuild = (): void => {
    // Load fires exactly once per init cycle. A rebuild() (e.g. text feature
    // calling us on SplitText auto-resplit) must NOT re-fire the load tween
    // — the new chars settle at their natural visible state, which is the
    // correct post-load state.
    if (isLoadOneShot && loadFired) return

    killCurrent()

    // aa-fallback signals the inline-snippet timeout already faded the
    // element in via CSS. Running our load tween now would rewind through
    // the from-state and flash. Mark load as fired so future rebuilds
    // remain no-ops.
    if (isLoadOneShot && document.documentElement.hasAttribute('aa-fallback')) {
      loadFired = true
      return
    }

    const built = opts.buildAnimation(buildVars())
    if (!built) return
    currentAnim = built.animation
    currentExtraCleanup = built.cleanup

    if (isLoadOneShot) {
      loadFired = true
      return
    }
    // Snap to end-state if rebuilding while the trigger pair was already
    // played forward. Scrub auto-syncs from scroll position on creation, so
    // it doesn't need this.
    if (triggerPlayed && opts.scrub === undefined) {
      currentAnim.progress(1).pause()
    }
  }

  rebuild()

  // Persistent trigger machinery — registered once. Callbacks close over
  // `currentAnim` (mutable `let`) so subsequent rebuilds are transparent.
  let triggerCleanup: () => void = () => {}

  if (persistentTrigger?.kind === 'event' && persistentTrigger.eventName) {
    triggerCleanup = subscribeWithPair({
      element,
      forwardName: persistentTrigger.eventName,
      onForward: () => {
        triggerPlayed = true
        // Always restart from time 0 so an interrupted reverse doesn't leak
        // forward; reset timeScale to 1 in case a prior reverse left it
        // accelerated.
        currentAnim?.timeScale(1).play(0)
      },
      onReverse: () => {
        triggerPlayed = false
        currentAnim?.timeScale(REVERSE_TIME_SCALE).reverse()
      },
    })
  } else if (!isLoadOneShot && opts.scrub === undefined && persistentTrigger) {
    triggerCleanup = bindAgainTrigger({
      gsap: ctx.gsap,
      trigger: triggerEl,
      start: opts.scrollStart,
      again: opts.again,
      onPlay: () => {
        triggerPlayed = true
        currentAnim?.play()
      },
      onReset: () => {
        triggerPlayed = false
        currentAnim?.progress(0).pause()
      },
    })
  }
  // Scrub path: the ScrollTrigger is bound to the animation's own vars —
  // killed/recreated by rebuild(). No separate machinery here.

  return {
    rebuild,
    dispose: () => {
      triggerCleanup()
      killCurrent()
    },
  }
}
