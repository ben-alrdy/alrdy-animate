import type { GsapTween } from './gsap-detect'
import type { FeatureContext } from './registry'
import { bindAgainTrigger } from './scroll-trigger'
import {
  isLoadKind,
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
 *   load-once / load             { delay }                            — plays immediately
 *   event                        { paused: true, delay, easeReverse } — paused, controlled by event pair
 *   scrub                        { delay, scrollTrigger }             — bound to scroll position
 *   scroll-again (the default)   { paused: true, delay }              — paused, controlled by enter/reset triggers
 *
 * `easeReverse` is a tween-level GSAP prop — spreading it into `gsap.from/to/fromTo`
 * works directly; timeline-based features must lift it into `defaults` so child
 * tweens inherit it (a top-level `easeReverse` on a timeline does not cascade).
 */
export interface TriggerVars {
  paused?: boolean
  delay: number
  easeReverse?: number | string
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

/**
 * Reshape TriggerVars for `gsap.timeline(...)`: lifts `easeReverse` into
 * `defaults` so child fromTo tweens inherit it (a top-level `easeReverse` on a
 * timeline does not cascade). Tween features can spread vars directly.
 */
export function toTimelineVars(vars: TriggerVars): Record<string, unknown> {
  const { easeReverse, ...rest } = vars
  if (easeReverse === undefined) return rest
  return { ...rest, defaults: { easeReverse } }
}

const WILL_CHANGE_TRANSFORM_KEYS = new Set([
  'x', 'y', 'z', 'xPercent', 'yPercent', 'scale', 'scaleX', 'scaleY',
  'rotation', 'rotate', 'rotationX', 'rotationY', 'rotationZ', 'skewX', 'skewY',
  'transform', 'transformPerspective',
])

/**
 * Derive a `will-change` value from a set of GSAP from/to vars — used by
 * entrance features so the orchestrator can hint the compositor for the exact
 * properties being animated (and nothing more). Returns '' when nothing maps,
 * which disables will-change management for that animation.
 */
export function cssWillChange(vars: Record<string, unknown>): string {
  const props: string[] = []
  let hasTransform = false
  for (const key of Object.keys(vars)) {
    if (key === 'opacity' || key === 'autoAlpha') {
      if (!props.includes('opacity')) props.push('opacity')
    } else if (key === 'filter') {
      if (!props.includes('filter')) props.push('filter')
    } else if (key === 'clipPath') {
      if (!props.includes('clip-path')) props.push('clip-path')
    } else if (WILL_CHANGE_TRANSFORM_KEYS.has(key)) {
      hasTransform = true
    }
  }
  if (hasTransform) props.unshift('transform')
  return props.join(', ')
}

export interface TriggeredAnimationOptions {
  /**
   * Pre-parsed triggers — the feature decides whether to use
   * `resolveTriggers` (with container inference for slider/tabs/modal) or
   * the bare `parseTriggers`. Passing the result keeps the helper agnostic.
   */
  triggers: ParsedTrigger[]
  /**
   * CSS `will-change` value to apply to the animated targets only while the
   * tween is actually playing — set on play/load, cleared on complete/reset.
   * Avoids leaving a permanent compositor layer (which also breaks descendant
   * `backdrop-filter`). Omit/empty to skip will-change management.
   */
  willChange?: string
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
  const hasLoad = opts.triggers.some((t) => isLoadKind(t.kind))
  const isLoadOneShot = (hasLoadOnce && ctx.firstInit) || hasLoad
  let persistentTrigger: ParsedTrigger | undefined
  if (!isLoadOneShot) {
    persistentTrigger = opts.triggers.find(
      (t) => t.kind !== 'load-once' && !isLoadKind(t.kind),
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
  let loadCompleted = false

  // will-change is applied to the animated targets only while a tween is
  // playing, then cleared — so it never lingers as a permanent compositor
  // layer (which wastes memory and, on a nav, neutralises a descendant's
  // backdrop-filter). `wcEls` snapshots the targets we set so we can clear
  // exactly those even after the tween's own targets list changes on rebuild.
  const wc = opts.willChange
  let wcEls: HTMLElement[] = []
  // Gather the animated elements for will-change. Tweens expose `targets()`;
  // timelines (e.g. the text feature's per-line builds) have no runtime
  // `targets()` despite the typed inheritance — walk their child tweens via
  // `getChildren()` instead. Calling the missing method would throw and abort
  // the play callback, leaving the animation stuck at its from-state.
  const collectTargets = (anim: GsapTween): Element[] => {
    const loose = anim as unknown as {
      targets?: () => unknown[]
      getChildren?: (nested?: boolean, tweens?: boolean, timelines?: boolean) => unknown[]
    }
    if (typeof loose.getChildren === 'function') {
      return loose.getChildren(true, true, false).flatMap((child) => {
        const c = child as { targets?: () => unknown[] }
        return typeof c.targets === 'function' ? (c.targets() as Element[]) : []
      })
    }
    return typeof loose.targets === 'function' ? (loose.targets() as Element[]) : []
  }
  const setWillChange = (): void => {
    if (!wc || !currentAnim) return
    wcEls = collectTargets(currentAnim).filter((t): t is HTMLElement => t instanceof HTMLElement)
    for (const el of wcEls) el.style.willChange = wc
  }
  const clearWillChange = (): void => {
    for (const el of wcEls) el.style.willChange = ''
    wcEls = []
  }

  const killCurrent = (): void => {
    clearWillChange()
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
    // Built `paused` so the wall-clock tween doesn't advance during the heavy
    // post-init layout/paint block (which would surface the entrance already
    // mid-fade). The orchestrator registers a paint-gated `restart(true)` via
    // `ctx.deferLoadStart` below; `from()`'s immediateRender writes the
    // from-state now so the revealed element shows true frame 0 while paused.
    if (isLoadOneShot) return { paused: true, delay: loadDelay }
    if (persistentTrigger?.kind === 'event') {
      return {
        paused: true,
        delay: opts.delay,
        easeReverse: REVERSE_EASE,
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
    // Once the load entrance has fully PLAYED, a later rebuild() (e.g. a
    // resize-driven SplitText auto-resplit) must NOT re-fire it — the fresh
    // chars settle at their natural visible (end) state, which is the correct
    // post-load result. We gate on completion, not registration: SplitText's
    // `autoSplit` fires an initial ResizeObserver callback ~one frame after
    // construction, which resplits and replaces the `.aa-char` nodes *before*
    // the gated entrance has played. That early resplit must rebuild the tween
    // against the new nodes (handled below via `loadFired && !loadCompleted`),
    // or the entrance is stranded on the orphaned originals — visible as the
    // text snapping straight to its end state with no animation (Firefox loses
    // this race more often than Chromium, but it's timing, not browser-bound).
    if (isLoadOneShot && loadCompleted) return

    const wasFired = loadFired

    // Snapshot the outgoing tween's forward progress before we kill it, so a
    // rebuild that lands while a *played* entrance hasn't finished yet can
    // resume from where it was instead of snapping to the end (see the block at
    // the end of rebuild). Scrub tweens sync from scroll and are excluded there.
    const prevProgress =
      currentAnim && opts.scrub === undefined ? currentAnim.progress() : null

    killCurrent()

    // aa-fallback signals the inline-snippet timeout already faded the
    // element in via CSS. Running our load tween now would rewind through
    // the from-state and flash. Mark load COMPLETE — not merely fired — so
    // every later rebuild short-circuits at the `loadCompleted` guard above.
    // `loadFired` alone isn't enough: init() clears `aa-fallback` at the end
    // of init, and SplitText's autoSplit fires an initial resplit ~one frame
    // later (see the loadCompleted comment above). That post-clear rebuild no
    // longer sees the flag, so it would build the tween (immediateRender
    // writes the from-state, hiding the already-revealed text) and, since
    // `wasFired` is set, restart(true) it — replaying the entrance the CSS
    // fallback already played. The fallback fulfilled the entrance; treat it
    // as done.
    if (isLoadOneShot && document.documentElement.hasAttribute('aa-fallback')) {
      loadFired = true
      loadCompleted = true
      return
    }

    const built = opts.buildAnimation(buildVars())
    if (!built) return
    currentAnim = built.animation
    currentExtraCleanup = built.cleanup

    if (wc) {
      // Clear when the tween settles in either direction. Scrub tweens never
      // fire these (they're scroll-scrubbed) and never call setWillChange, so
      // they opt out of will-change management entirely — force3D handles their
      // compositing.
      currentAnim.eventCallback('onComplete', clearWillChange)
      currentAnim.eventCallback('onReverseComplete', clearWillChange)
    }

    if (isLoadOneShot) {
      // Mark the entrance complete once it finishes so a later resize-resplit
      // becomes a no-op (the early-return above). This replaces the wc onComplete
      // set just above, so fold clearWillChange back in to keep that behaviour.
      currentAnim.eventCallback('onComplete', () => {
        loadCompleted = true
        clearWillChange()
      })
      // Warm the layer now so it's ready before the (delayed) load tween plays.
      setWillChange()
      if (wasFired) {
        // A pre-completion resplit replaced our targets (autoSplit's initial
        // ResizeObserver fire). The load gate has already been built — and by
        // now likely flushed — so re-deferring would strand this tween (the
        // gate only flushes once). Play it directly: restart(true) replays from
        // frame 0 including the delay. The spurious resplit lands within a
        // frame of the gate flush, so the original entrance had barely begun;
        // restarting from 0 is visually seamless.
        currentAnim.restart(true)
      } else {
        // First build: hand the paused tween to the load gate; init() releases
        // it after first paint via restart(true). Reached only past the
        // aa-fallback early-return, so the slow-network CSS fallback still wins
        // when it's set (nothing registers for this element).
        if (currentAnim) ctx.deferLoadStart(currentAnim)
      }
      loadFired = true
      return
    }
    // Restore the forward-played state onto the rebuilt tween. We reproduce the
    // *actual* progress the outgoing tween had reached rather than forcing
    // progress(1): a rebuild (SplitText auto-resplit) that lands while the
    // entrance is still in flight — e.g. an unrelated `ScrollTrigger.refresh()`
    // or reflow a beat after an `event:`-fire re-wraps the lines — then keeps
    // playing to the end instead of snapping straight there (which read as "the
    // heading appears instantly, no animation"). `progress < 1` is the test, not
    // isActive(): it covers both the mid-fade case AND a resplit during the
    // entrance's `aa-delay` (progress still 0, isActive() false) — both must
    // play through, or the entrance would be left paused at its from-state,
    // stuck invisible. A finished entrance had progress 1, so it stays paused at
    // the end — refresh/resize re-measures of completed text are unchanged.
    // Scrub auto-syncs from scroll position on creation, so it opts out.
    if (triggerPlayed && opts.scrub === undefined) {
      const resume = prevProgress ?? 1
      currentAnim.progress(resume)
      if (resume < 1) {
        // Not finished (mid-fade, or still in its delay) — keep playing, and
        // re-warm the compositor hint for the freshly split targets
        // (killCurrent cleared the old ones).
        setWillChange()
        currentAnim.play()
      } else {
        currentAnim.pause()
      }
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
        setWillChange()
        // Restart from the beginning *including the delay* so an interrupted
        // reverse doesn't leak forward AND `aa-delay` is honored on every fire.
        // `play(0)` would skip the delay — GSAP's `delay` is a start-offset on
        // the parent timeline, and time 0 sits after it, so a paused tween's
        // delay never replays via play(0). `restart(true)` rewinds past the
        // delay. timeScale is reset to 1 in case a prior reverse accelerated it;
        // suppressEvents (default) keeps the rewind from firing the
        // onReverseComplete that would clear the will-change we just set.
        currentAnim?.timeScale(1).restart(true)
      },
      onReverse: () => {
        triggerPlayed = false
        setWillChange()
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
        setWillChange()
        currentAnim?.play()
      },
      onReset: () => {
        triggerPlayed = false
        clearWillChange()
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
