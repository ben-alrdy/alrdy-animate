import '../css/alrdy-animate.css'
import type {
  DestroyApiOptions,
  InitOptions,
  OnResizeOptions,
  PublicApi,
  ResizeCallback,
  ResizeUnsubscribe,
} from '../types/index'
import { detectGsap, type GsapHandle } from './gsap-detect'
import { createResponsiveController, type ResponsiveController } from './match-media'
import { NAMED_EASES } from './named-eases'
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
  DEFAULT_OPTIONS,
  DEFAULT_REDUCED_MOTION,
  addDisposer,
  resolveBreakpoints,
  resolveOptions,
  runAllDisposers,
  state,
} from './state'
import { initSmoothScroll } from '../smooth-scroll/index'
import type { ReducedMotionOptions } from '../types/index'

let activeHandles: { gsap: GsapHandle; responsive: ResponsiveController } | null = null

function detectReducedMotion(
  setting: boolean | ReducedMotionOptions,
): ReducedMotionOptions | null {
  if (setting === false) return null
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  return setting === true ? DEFAULT_REDUCED_MOTION : setting
}

function detectOptimizeMobile(setting: boolean, mdBreakpoint: number): boolean {
  if (setting !== true) return false
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  // Match the same exclusive width arithmetic the responsive system uses
  // (see core/settings.ts `buildRangeQuery`) so the cutoff is consistent
  // with `aa-foo-md`/the `|` shorthand split point.
  return window.matchMedia(`(max-width: ${mdBreakpoint - 0.02}px)`).matches
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
  const { elements, features } = scan(root)
  if (elements.length === 0) return

  // Detect reduced motion + mobile-optimization BEFORE feature dispatch so we
  // can drop decorative feature modules from the load set entirely. Both
  // conditions route the same fade-fallback pass:
  //   reducedMotion = OS-level preference (broad set, includes appear)
  //   optimizeMobile = small-viewport perf gate (heavy features only)
  // When both fire, reduced motion's superset wins.
  const reducedMotion = detectReducedMotion(state.options.reducedMotion)
  const optimizeMobile = !reducedMotion && detectOptimizeMobile(
    state.options.optimizeMobile,
    state.breakpoints.md,
  )

  let replacedFeatures: ReadonlySet<FeatureName>
  let fadeFeatures: ReadonlySet<FeatureName>
  if (reducedMotion) {
    replacedFeatures = REDUCED_MOTION_REPLACED_FEATURES
    fadeFeatures = REDUCED_MOTION_FADE_FEATURES
  } else if (optimizeMobile) {
    replacedFeatures = OPTIMIZE_MOBILE_REPLACED_FEATURES
    fadeFeatures = OPTIMIZE_MOBILE_FADE_FEATURES
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

  // Drop hover on touch-only devices — the module's own init() also self-skips
  // there (belt-and-braces), but gating here saves the dynamic import.
  if (effectiveFeatures.has('hover') && !deviceHasHover()) {
    effectiveFeatures.delete('hover')
  }

  const requiredPlugins = new Set<string>()
  for (const f of effectiveFeatures) {
    if (
      f === 'scroll' ||
      f === 'text' ||
      f === 'reveal' ||
      f === 'parallax' ||
      f === 'nav' ||
      f === 'marquee'
    ) {
      requiredPlugins.add('ScrollTrigger')
    }
    if (f === 'text' || f === 'split') requiredPlugins.add('SplitText')
    if (f === 'slider' || f === 'marquee') {
      requiredPlugins.add('Draggable')
      requiredPlugins.add('InertiaPlugin')
    }
    if (f === 'nav') requiredPlugins.add('Flip')
  }
  if (needsFadePass) requiredPlugins.add('ScrollTrigger')

  const gsapHandle = detectGsap([...requiredPlugins], debug)
  if (!gsapHandle) return

  registerCustomEases(gsapHandle, debug)
  try {
    gsapHandle.gsap.defaults({ ease: state.options.ease })
  } catch {
    // ignore
  }

  // Globals (Lenis, scroll-state, scroll-target) persist across re-inits when
  // the consumer calls `destroy({ keepGlobals: true })` — typical for
  // page-transition libraries (Barba, Next.js View Transitions). They're
  // bound to elements that don't change on route changes
  // (`document.documentElement`, `<body>`), so re-creating them every nav
  // costs scroll-position state and CPU.
  const smoothScrollOpt = state.options.smoothScroll
  if (smoothScrollOpt && !state.smoothScroll) {
    state.smoothScroll = initSmoothScroll(gsapHandle, smoothScrollOpt, debug)
  }

  if (state.options.scrollState && !state.scrollStateDispose) {
    state.scrollStateDispose = initScrollState()
  }
  if (!state.scrollTargetDispose) {
    state.scrollTargetDispose = initScrollTarget()
  }

  const responsive = createResponsiveController(gsapHandle, state.breakpoints)
  activeHandles = { gsap: gsapHandle, responsive }

  // Run the unified fade-fallback pass BEFORE feature inits so its
  // ScrollTriggers register first. Component features that run after still
  // see their elements at the correct positions (no transform conflicts).
  if (needsFadePass) {
    // Mobile-optimization mode reuses reducedMotion's fade timing for
    // consistency. Override here if you ever want a separate `optimizeMobile`
    // fade-timing knob (e.g. snappier 0.3s fade for perf-focused mobile).
    const fadeTiming = reducedMotion ?? DEFAULT_REDUCED_MOTION
    const disposeFade = runFadeFallbackPass(elements, {
      gsap: gsapHandle,
      options: state.options,
      reducedMotion: fadeTiming,
      firstInit: !state.firstInitComplete,
      fadeFor: fadeFeatures,
    })
    addDisposer(disposeFade)
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
    onResize: (fn, debounce = 150) => subscribeResize(fn, debounce),
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
  for (const el of elements) {
    if (el.hasAttribute('aa-animate')) el.setAttribute('aa-ready', '')
  }

  // Mark first-init done. Survives every destroy() so subsequent inits (e.g.
  // Barba navigations) know `aa-trigger="load"` already played. Reset only by
  // a hard page reload, which reloads this module too.
  state.firstInitComplete = true

  // Clear the slow-network fallback marker now that init has run. If the
  // inline-snippet timeout fired (set aa-fallback on first load), we no
  // longer need it — the bundle is here. Leaving it set would re-trigger the
  // CSS keyframe on every Barba navigation, since each new container renders
  // its [aa-trigger="load"] elements without aa-ready until init catches up.
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('aa-fallback')
  }

  if (debug) {
    const lenisActive = typeof window !== 'undefined' && !!window.lenis
    const loadedFeatures = [...effectiveFeatures]
    const droppedFeatures = [...features].filter((f) => !effectiveFeatures.has(f))
    const replacedBy = reducedMotion ? 'reduced-motion' : optimizeMobile ? 'optimize-mobile' : null
    const featuresLabel =
      replacedBy && droppedFeatures.length
        ? `${loadedFeatures.join(', ') || '(none)'} (${replacedBy} replaced: ${droppedFeatures.join(', ')})`
        : loadedFeatures.join(', ') || '(none)'
    console.log(
      `[alrdy-animate] initialized. Features: ${featuresLabel}; ` +
        `Plugins: ${[...requiredPlugins].join(', ') || '(none)'}; ` +
        `Elements: ${elements.length}; ` +
        `SmoothScroll: ${lenisActive ? 'lenis' : 'off'}; ` +
        `ReducedMotion: ${reducedMotion ? 'active' : 'off'}; ` +
        `OptimizeMobile: ${optimizeMobile ? 'active' : 'off'}`,
    )
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

const api: PublicApi = { init, destroy, refresh, onResize }

declare global {
  interface Window {
    AlrdyAnimate: PublicApi
  }
}

if (typeof window !== 'undefined') {
  window.AlrdyAnimate = api
}

export { api }
