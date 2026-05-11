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
import { loadFeatures, type FeatureContext } from './registry'
import { clearAll as clearResize, subscribe as subscribeResize } from './resize'
import { scan } from './scanner'
import { initScrollState } from './scroll-state'
import { initScrollTarget } from './scroll-target'
import {
  DEFAULT_OPTIONS,
  addDisposer,
  resolveBreakpoints,
  resolveOptions,
  runAllDisposers,
  state,
} from './state'
import { initSmoothScroll } from '../smooth-scroll/index'

let activeHandles: { gsap: GsapHandle; responsive: ResponsiveController } | null = null

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

  const requiredPlugins = new Set<string>()
  for (const f of features) {
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

  const featureModules = await loadFeatures(features)
  const featureCtx: FeatureContext = {
    gsap: gsapHandle,
    responsive,
    elements,
    options: state.options,
    debug,
    firstInit: !state.firstInitComplete,
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
    console.log(
      `[alrdy-animate] initialized. Features: ${[...features].join(', ') || '(none)'}; ` +
        `Plugins: ${[...requiredPlugins].join(', ') || '(none)'}; ` +
        `Elements: ${elements.length}; ` +
        `SmoothScroll: ${lenisActive ? 'lenis' : 'off'}`,
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
