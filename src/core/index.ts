import '../css/alrdy-animate.css'
import type {
  DestroyApiOptions,
  InitOptions,
  OnResizeOptions,
  PublicApi,
  ResizeCallback,
  ResizeUnsubscribe,
} from '../types/index'
import { detectGsap, type GsapHandle, type GsapTween } from './gsap-detect'
import { createResponsiveController, type ResponsiveController } from './match-media'
import { NAMED_EASES } from './named-eases'
import { resolvePresets } from './presets'
import {
  OPTIMIZE_MOBILE_FADE_FEATURES,
  OPTIMIZE_MOBILE_REPLACED_FEATURES,
  REDUCED_MOTION_FADE_FEATURES,
  REDUCED_MOTION_REPLACED_FEATURES,
  runFadeFallbackPass,
} from './reduced-motion'
import { loadFeatures, type FeatureContext } from './registry'
import { clearAll as clearResize, subscribe as subscribeResize } from './resize'
import { scan, type FeatureName } from './scanner'
import { initScrollState } from './scroll-state'
import { initScrollTarget } from './scroll-target'
import {
  DEFAULT_OPTIMIZE_MOBILE_FADE,
  DEFAULT_OPTIONS,
  DEFAULT_REDUCED_MOTION,
  addDisposer,
  getReadyPromise,
  newReadyDeferred,
  resolveBreakpoints,
  resolveOptions,
  resolveReady,
  runAllDisposers,
  state,
} from './state'
import { initSmoothScroll } from '../smooth-scroll/index'
import type { ReducedMotionOptions } from '../types/index'

let activeHandles: { gsap: GsapHandle; responsive: ResponsiveController } | null = null

// Upper bound on how long init() will wait for `document.fonts.ready` before a
// line-split text entrance (see the gated await below). Caps the worst case
// (a slow/blocked webfont) so init can't hang for seconds; preloading the hero
// font keeps fonts.ready well under this.
const FONT_METRICS_TIMEOUT_MS = 3000

function detectReducedMotion(
  setting: boolean | ReducedMotionOptions,
): ReducedMotionOptions | null {
  if (setting === false) return null
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  return setting === true ? DEFAULT_REDUCED_MOTION : setting
}

function detectOptimizeMobile(
  setting: boolean | 'fade',
  mdBreakpoint: number,
): false | true | 'fade' {
  if (setting !== true && setting !== 'fade') return false
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  // Match the same exclusive width arithmetic the responsive system uses
  // (see core/settings.ts `buildRangeQuery`) so the cutoff is consistent
  // with `aa-foo-md`/the `|` shorthand split point.
  if (!window.matchMedia(`(max-width: ${mdBreakpoint - 0.02}px)`).matches) return false
  // Preserve the mode so the caller can choose "just visible" (true) vs the
  // soft fade ('fade').
  return setting
}

/**
 * Touch-only devices can't fire hover events, so loading the hover module just
 * to have its init() return a no-op is pure waste (~3KB gzipped + parse).
 * Gate on pointer capability, not viewport — a hybrid laptop with a narrow
 * window still has a mouse, and we want hover to keep working there.
 *
 * Independent of `optimizeMobile`: this is correctness, not a perf knob.
 */
function deviceHasHover(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(hover: hover)').matches
}

function registerCustomEases(handle: GsapHandle, debug: boolean): void {
  const w = window as unknown as Record<string, unknown>
  const CustomEase = w.CustomEase as
    | { create: (id: string, value: string) => unknown }
    | undefined
  if (!CustomEase) {
    if (debug) {
      console.warn(
        `[alrdy-animate] CustomEase not loaded — named eases (${Object.keys(NAMED_EASES).join(', ')}) are unavailable. Add <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/CustomEase.min.js"></script> before alrdy-animate.`,
      )
    }
    return
  }
  try {
    handle.gsap.registerPlugin(CustomEase)
  } catch {
    // already registered; ignore
  }
  for (const [name, path] of Object.entries(NAMED_EASES)) {
    try {
      CustomEase.create(name, path)
    } catch (err) {
      if (debug) console.warn(`[alrdy-animate] failed to register named ease "${name}"`, err)
    }
  }
}

export async function init(options: InitOptions = {}): Promise<void> {
  if (state.initialized) return
  newReadyDeferred()
  // Marker for the optional slow-network fallback recipe (docs/recipes/load-fallback).
  // The inline <head> snippet checks for this attribute after a tunable timeout;
  // setting it as the very first synchronous step in init means the snippet only
  // fires its CSS fallback if init hasn't even *started* by the deadline.
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('aa-loaded', '')
  }
  state.options = resolveOptions(options)
  state.breakpoints = resolveBreakpoints(options.breakpoints)
  state.initialized = true

  const debug = options.debug ?? false
  const root = options.root ?? document

  // Resolve class → animation presets BEFORE scan so the scanner can fold in
  // preset-only elements (those with no `aa-*` attrs) and classify them by
  // their virtual `aa-animate` value. The map is in-memory only — we never
  // mutate the DOM. Elements with any explicit `aa-*` attribute are skipped
  // by `resolvePresets()`, honouring the "attribute wins over preset" rule.
  const presetMap = resolvePresets(root, options.presets, debug)
  state.presetMap = presetMap

  // Detect reduced motion + mobile-optimization eagerly so that:
  //  (1) we can drop decorative feature modules from the load set entirely,
  //  (2) outside scripts reading `AlrdyAnimate.options.reducedMotion` /
  //      `.optimizeMobile` after `await ready()` see the collapsed boolean
  //      reflecting actual runtime state, not the user-passed setting shape.
  // Both conditions route the same fade-fallback pass:
  //   reducedMotion = OS-level preference (broad set, includes appear)
  //   optimizeMobile = small-viewport perf gate (heavy features only)
  // When both fire, reduced motion's superset wins.
  const reducedMotion = detectReducedMotion(state.options.reducedMotion)
  const optimizeMobile = !reducedMotion && detectOptimizeMobile(
    state.options.optimizeMobile,
    state.breakpoints.md,
  )
  // Collapse the public snapshot: reducedMotion → plain boolean (its timing
  // object lives in the local `reducedMotion` variable and is threaded into
  // `featureCtx.reducedMotion` / `runFadeFallbackPass` below); optimizeMobile →
  // the active mode (`true` / `'fade'`) or `false` when inactive.
  state.options.reducedMotion = !!reducedMotion
  state.options.optimizeMobile = optimizeMobile

  const { elements, features, needsHoverSplit, needsFontMetrics } = scan(root, presetMap)
  if (elements.length === 0) {
    resolveReady()
    return
  }

  let replacedFeatures: ReadonlySet<FeatureName>
  let fadeFeatures: ReadonlySet<FeatureName>
  if (reducedMotion) {
    replacedFeatures = REDUCED_MOTION_REPLACED_FEATURES
    fadeFeatures = REDUCED_MOTION_FADE_FEATURES
  } else if (optimizeMobile) {
    // text/parallax/split are dropped in both modes (identical perf win); only
    // the fade set differs — `'fade'` fades text, `true` leaves it static.
    replacedFeatures = OPTIMIZE_MOBILE_REPLACED_FEATURES
    fadeFeatures = optimizeMobile === 'fade' ? OPTIMIZE_MOBILE_FADE_FEATURES : new Set()
  } else {
    replacedFeatures = new Set()
    fadeFeatures = new Set()
  }

  const effectiveFeatures = new Set(features)
  let needsFadePass = false
  for (const f of replacedFeatures) {
    if (!effectiveFeatures.has(f)) continue
    effectiveFeatures.delete(f)
    if (fadeFeatures.has(f)) needsFadePass = true
  }

  // Init-timeout bypass: the inline-snippet's universal safety net fired before
  // we got here (`html[aa-timeout]` set after a tunable deadline, default 4s).
  // Elements are already visible at their natural state; rewinding them through
  // a from-state now would flash. Drop the appearance features that own those
  // entrances — interactive components still run normally so the page is fully
  // functional. The end-of-init aa-ready flip and aa-timeout clear still fire.
  const timedOut =
    typeof document !== 'undefined' &&
    document.documentElement.hasAttribute('aa-timeout')
  if (timedOut) {
    effectiveFeatures.delete('appear')
    effectiveFeatures.delete('text')
    effectiveFeatures.delete('reveal')
    effectiveFeatures.delete('parallax')
    needsFadePass = false
  }

  // Drop hover on touch-only devices — the module's own init() also self-skips
  // there (belt-and-braces), but gating here saves the dynamic import.
  if (effectiveFeatures.has('hover') && !deviceHasHover()) {
    effectiveFeatures.delete('hover')
  }

  const requiredPlugins = new Set<string>()
  for (const f of effectiveFeatures) {
    if (
      f === 'appear' ||
      f === 'text' ||
      f === 'reveal' ||
      f === 'slices' ||
      f === 'parallax' ||
      f === 'nav' ||
      f === 'marquee'
    ) {
      requiredPlugins.add('ScrollTrigger')
    }
    if (f === 'text' || f === 'split') requiredPlugins.add('SplitText')
    // hover='text' (char/word lift) is the only hover head that needs
    // SplitText; the scanner flags it during its single DOM pass. Reaching here
    // with f==='hover' implies the device has hover — touch-only devices drop
    // `hover` from effectiveFeatures above, so no matchMedia check is needed.
    if (f === 'hover' && needsHoverSplit) requiredPlugins.add('SplitText')
    if (f === 'slider' || f === 'marquee') {
      requiredPlugins.add('Draggable')
      requiredPlugins.add('InertiaPlugin')
    }
    if (f === 'nav') requiredPlugins.add('Flip')
  }
  if (needsFadePass) requiredPlugins.add('ScrollTrigger')

  const gsapHandle = detectGsap([...requiredPlugins], debug)
  if (!gsapHandle) {
    resolveReady()
    return
  }

  registerCustomEases(gsapHandle, debug)
  try {
    gsapHandle.gsap.defaults({ ease: state.options.ease })
  } catch {
    // ignore
  }

  // Lenis is genuinely global: it owns the page-level scroll behaviour and
  // its instance is keyed to `document.documentElement`, which doesn't change
  // across route swaps. Preserving it across `destroy({ keepGlobals: true })`
  // keeps the scroll position smooth through a page transition and avoids
  // re-instantiating the RAF/ticker every navigation.
  const smoothScrollOpt = state.options.smoothScroll
  if (smoothScrollOpt && !state.smoothScroll) {
    state.smoothScroll = initSmoothScroll(gsapHandle, smoothScrollOpt, debug)
  }

  // Scroll-state and scroll-target listeners are bound to elements that DO
  // change across SPA navigations (Next.js App Router, Barba container swap):
  // `[aa-toggle-playstate]` IntersectionObserver targets and
  // `[aa-scroll-target]` click listeners. If we skipped re-attaching when
  // dispose still exists (from `keepGlobals: true`), the new route's DOM
  // would never get listeners. So always tear down and re-attach — the
  // dispose calls remove listeners cleanly, and the re-init scans current
  // DOM. One `querySelectorAll` per init, negligible cost.
  if (state.options.scrollState) {
    state.scrollStateDispose?.()
    state.scrollStateDispose = initScrollState()
  }
  state.scrollTargetDispose?.()
  state.scrollTargetDispose = initScrollTarget()

  const responsive = createResponsiveController(gsapHandle, state.breakpoints)
  activeHandles = { gsap: gsapHandle, responsive }

  // Load gate: `load` / `load-once` entrances build `paused` and register the
  // tween here instead of autoplaying. We release them one paint AFTER the
  // aa-ready reveal (below) so a wall-clock tween can't advance during the
  // heavy post-init layout/paint block and surface already mid-fade. Lives as
  // a closure local (auto-GC'd per init, no global state); a disposer flips
  // `gateCancelled` so a pending flush after destroy() is a no-op. Created
  // before the fade pass so both it and the feature context share the hook.
  const loadGate: GsapTween[] = []
  let gateCancelled = false
  const deferLoadStart = (tween: GsapTween): void => {
    if (!gateCancelled) loadGate.push(tween)
  }
  addDisposer(() => {
    gateCancelled = true
  })

  // Run the unified fade-fallback pass BEFORE feature inits so its
  // ScrollTriggers register first. Component features that run after still
  // see their elements at the correct positions (no transform conflicts).
  if (needsFadePass) {
    // reducedMotion's own timing wins when it's active; otherwise this pass was
    // scheduled by `optimizeMobile: 'fade'`, which uses a softer/slower fade.
    const fadeTiming = reducedMotion ?? DEFAULT_OPTIMIZE_MOBILE_FADE
    const disposeFade = runFadeFallbackPass(elements, {
      gsap: gsapHandle,
      options: state.options,
      reducedMotion: fadeTiming,
      firstInit: !state.firstInitComplete,
      fadeFor: fadeFeatures,
      presetMap,
      deferLoadStart,
    })
    addDisposer(disposeFade)
  }

  // SplitText (used by the text feature) is created with `autoSplit: true`,
  // which re-splits when `document.fonts.ready` resolves to pick up real-font
  // line metrics. If init runs before fonts are ready, the entry tween starts
  // playing against fallback-font chars, then the font-load resplit replaces
  // those chars and `handle.rebuild()` snaps the new timeline to progress(1)
  // because `triggerPlayed` is true — visible as a brief flash followed by a
  // jump to the end state. Awaiting fonts up front makes SplitText split once
  // with correct metrics.
  //
  // Gated on `needsFontMetrics` (a **line** split is present) rather than the
  // whole text feature: only line wrapping shifts when the webfont swaps, so
  // char/word-only text pages (and non-text pages) skip the wait and init
  // sooner — char/word splits self-correct via the resplit-rebuild path. Capped
  // with a race so a slow/blocked font can't hang init for seconds; past the
  // cap we proceed and accept a possible one-off resplit (preloading the hero
  // font keeps fonts.ready well under the cap). FOUC guard hides animated
  // elements during the wait.
  if (
    needsFontMetrics &&
    typeof document !== 'undefined' &&
    document.fonts?.ready
  ) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise<void>((resolve) => setTimeout(resolve, FONT_METRICS_TIMEOUT_MS)),
      ])
    } catch {
      // fonts.ready can reject in edge cases (e.g. font load errors); proceed.
    }
  }

  const featureModules = await loadFeatures(effectiveFeatures)
  const featureCtx: FeatureContext = {
    gsap: gsapHandle,
    responsive,
    elements,
    options: state.options,
    debug,
    firstInit: !state.firstInitComplete,
    reducedMotion,
    presetMap,
    onResize: (fn, debounce = 150) => subscribeResize(fn, debounce),
    deferLoadStart,
  }
  for (const mod of featureModules) {
    try {
      const dispose = mod.init(featureCtx)
      addDisposer(dispose)
    } catch (err) {
      console.error(`[alrdy-animate] feature "${mod.name}" failed to init`, err)
    }
  }

  // Reveal everything in one pass. Features have already applied their
  // from-states inside matchMedia callbacks (which fire synchronously), so
  // flipping aa-ready here only changes `visibility: hidden` → `visible`
  // without exposing pre-animation content. Elements that never matched any
  // breakpoint still get revealed so the page isn't stuck blank.
  // Preset elements have no `aa-animate` attribute (the preset map fills
  // that in virtually) and weren't FOUC-hidden in the first place — skip them.
  for (const el of elements) {
    if (el.hasAttribute('aa-animate')) el.setAttribute('aa-ready', '')
  }

  // Mark first-init done. Survives every destroy() so subsequent inits (e.g.
  // Barba navigations) know `aa-trigger="load-once"` already played. Reset only by
  // a hard page reload, which reloads this module too.
  state.firstInitComplete = true

  // Clear the slow-network fallback markers now that init has run. If the
  // inline-snippet timeouts fired (set aa-fallback / aa-timeout on first
  // load), we no longer need them — the bundle is here. Leaving them set
  // would re-trigger the CSS rules on every Barba navigation, since each new
  // container renders its elements without aa-ready until init catches up.
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('aa-fallback')
    document.documentElement.removeAttribute('aa-timeout')
  }

  if (debug) {
    const lenisActive = typeof window !== 'undefined' && !!window.lenis
    const loadedFeatures = [...effectiveFeatures]
    const droppedFeatures = [...features].filter((f) => !effectiveFeatures.has(f))
    const replacedBy = timedOut
      ? 'aa-timeout bypass'
      : reducedMotion
        ? 'reduced-motion'
        : optimizeMobile
          ? `optimize-mobile (${optimizeMobile === 'fade' ? 'fade' : 'visible'})`
          : null
    const featuresLabel =
      replacedBy && droppedFeatures.length
        ? `${loadedFeatures.join(', ') || '(none)'} (${replacedBy} dropped: ${droppedFeatures.join(', ')})`
        : loadedFeatures.join(', ') || '(none)'
    console.log(
      `[alrdy-animate] initialized. Features: ${featuresLabel}; ` +
        `Plugins: ${[...requiredPlugins].join(', ') || '(none)'}; ` +
        `Elements: ${elements.length}; ` +
        `SmoothScroll: ${lenisActive ? 'lenis' : 'off'}; ` +
        `ReducedMotion: ${reducedMotion ? 'active' : 'off'}; ` +
        `OptimizeMobile: ${optimizeMobile ? optimizeMobile : 'off'}`,
    )
  }

  resolveReady()

  // Release paint-gated load entrances (registered via `deferLoadStart`) one
  // paint AFTER the aa-ready reveal, so they start visibly at frame 0 instead
  // of a wall-clock tween advancing during the post-init layout/paint block.
  // `flush` is guarded by `gateCancelled` (so destroy() before release is a
  // no-op) and empties the gate (so it's harmless if somehow run twice).
  // Scheduled after resolveReady() so `await ready()` observers see the
  // from-state, not a half-played frame.
  //
  // Double-rAF, NOT a timer: GSAP's own ticker rAF (registered at load, before
  // ours) runs first in each rendering step, so by the time our flush calls
  // restart() the ticker clock is already advanced to "now" and the tween
  // anchors at 0. A `setTimeout` flush would instead run as a task BEFORE the
  // rendering step — on a page blocked past the timer it would release while
  // the ticker clock is stale, then the next tick jumps the tween forward:
  // the exact mid-fade pop-in this gate prevents. No timer is needed for
  // safety either: a tab hidden now takes the synchronous branch; a tab
  // backgrounded after scheduling has rAF suspended but resumes (and flushes)
  // on return to the foreground, so the entrance is never stuck invisible.
  if (loadGate.length > 0) {
    const flush = (): void => {
      if (gateCancelled) return
      for (const tween of loadGate.splice(0)) {
        try {
          tween.restart(true)
        } catch (err) {
          console.error('[alrdy-animate] load release threw', err)
        }
      }
    }
    if (
      typeof requestAnimationFrame !== 'function' ||
      (typeof document !== 'undefined' && document.visibilityState === 'hidden')
    ) {
      // SSR or a tab hidden right now — no paint is coming to gate against.
      flush()
    } else {
      requestAnimationFrame(() => requestAnimationFrame(flush))
    }
  }
}

export function destroy(options: DestroyApiOptions = {}): void {
  if (activeHandles?.responsive) {
    try {
      if (options.keepFromStates) activeHandles.responsive.killAll()
      else activeHandles.responsive.revertAll()
    } catch (err) {
      console.error('[alrdy-animate] responsive controller cleanup threw', err)
    }
  }
  runAllDisposers()
  clearResize()
  activeHandles = null
  state.initialized = false
  state.presetMap = new Map()

  if (!options.keepGlobals) {
    state.smoothScroll?.dispose()
    state.smoothScroll = null
    state.scrollStateDispose?.()
    state.scrollStateDispose = null
    state.scrollTargetDispose?.()
    state.scrollTargetDispose = null
  }

  state.options = { ...DEFAULT_OPTIONS }
}

export async function refresh(): Promise<void> {
  destroy()
  await init(state.options)
}

export function onResize(fn: ResizeCallback, opts: OnResizeOptions = {}): ResizeUnsubscribe {
  return subscribeResize(fn, opts.debounce ?? 150)
}

export { getReadyPromise as ready } from './state'

const api: PublicApi = {
  init,
  destroy,
  refresh,
  onResize,
  ready: getReadyPromise,
  // Live getter — always reflects the latest init() snapshot without
  // consumers needing to re-grab the api object after refresh().
  get options() {
    return state.options
  },
}

declare global {
  interface Window {
    AlrdyAnimate: PublicApi
  }
}

if (typeof window !== 'undefined') {
  window.AlrdyAnimate = api
}

export { api }
