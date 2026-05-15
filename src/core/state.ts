import type {
  AutoplayOptions,
  Breakpoints,
  InitOptions,
  ReducedMotionOptions,
  ResolvedOptions,
  StaggerOptions,
} from '../types/index'
import type { ResolvedPreset } from './presets'
import type { SmoothScrollHandle } from '../smooth-scroll/index'

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  sm: 480,
  md: 768,
  lg: 992,
  xl: 1280,
}

const DEFAULT_STAGGER: StaggerOptions = {
  chars: 0.02,
  words: 0.05,
  lines: 0.1,
  default: 0.1,
}

const DEFAULT_AUTOPLAY: AutoplayOptions = {
  interval: 4,
  hoverPause: false,
}

export const DEFAULT_REDUCED_MOTION: ReducedMotionOptions = {
  duration: 0.4,
  ease: 'power1.out',
}

/**
 * Single source of truth for init-time defaults. Features must NOT carry
 * their own per-animation duration / ease / stagger fallbacks — they always
 * pull from `ctx.options`, which is `ResolvedOptions` (every field populated
 * after resolveOptions has merged these defaults).
 */
export const DEFAULT_OPTIONS: ResolvedOptions = {
  duration: 0.6,
  ease: 'power4.out',
  distance: 1,
  loadDelay: 0.1,
  scrollStart: 'top 85%',
  scrollEnd: 'bottom 60%',
  again: true,
  stagger: DEFAULT_STAGGER,
  autoplay: DEFAULT_AUTOPLAY,
  breakpoints: DEFAULT_BREAKPOINTS,
  smoothScroll: true,
  scrollState: true,
  reducedMotion: true,
  optimizeMobile: false,
}

function resolveReducedMotion(
  input: InitOptions['reducedMotion'],
): boolean | ReducedMotionOptions {
  if (input === false) return false
  if (input === undefined || input === true) return true
  return { ...DEFAULT_REDUCED_MOTION, ...input }
}

export function resolveOptions(opts: InitOptions): ResolvedOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...opts,
    stagger: { ...DEFAULT_STAGGER, ...opts.stagger },
    autoplay: { ...DEFAULT_AUTOPLAY, ...opts.autoplay },
    breakpoints: { ...DEFAULT_BREAKPOINTS, ...opts.breakpoints },
    reducedMotion: resolveReducedMotion(opts.reducedMotion),
  }
}

export interface InternalState {
  initialized: boolean
  options: ResolvedOptions
  breakpoints: Breakpoints
  /**
   * Per-init feature disposers — torn down on every destroy() call. Anything
   * scoped to the current page's content (matchMedia revert, ScrollTrigger
   * cleanup, individual feature inits) goes here.
   */
  disposers: Array<() => void>
  /**
   * App-global handles that can survive `destroy({ keepGlobals: true })`.
   * Lenis, scroll-state, and scroll-target are all bound to elements that
   * persist across page transitions (`document.documentElement`, `<body>`),
   * so re-creating them on every Barba/Next.js route change is wasteful and
   * costs scroll-position state.
   */
  smoothScroll: SmoothScrollHandle | null
  scrollStateDispose: (() => void) | null
  scrollTargetDispose: (() => void) | null
  /**
   * Set true at the END of the very first successful init() call in this
   * page session. Survives `destroy()` (any flavour) and subsequent inits.
   * Drives `aa-trigger="load-once"` semantics: load-once fires only on the
   * first init cycle so subsequent Barba navigations don't replay the
   * animation while the new container is hidden behind the transition wrapper.
   */
  firstInitComplete: boolean
  /**
   * Class-name → animation preset resolution from the last `init()` call.
   * Populated by `resolvePresets()` before scan; consumed by scanner +
   * `readAttrs()` as a fallback attribute source. Empty when no `presets`
   * option was passed. Reset on every destroy() so the next init starts
   * fresh.
   */
  presetMap: Map<Element, ResolvedPreset>
}

const initial = (): InternalState => ({
  initialized: false,
  options: { ...DEFAULT_OPTIONS },
  breakpoints: { ...DEFAULT_BREAKPOINTS },
  disposers: [],
  smoothScroll: null,
  scrollStateDispose: null,
  scrollTargetDispose: null,
  firstInitComplete: false,
  presetMap: new Map(),
})

export const state: InternalState = initial()

export function resolveBreakpoints(opts: InitOptions['breakpoints']): Breakpoints {
  return { ...DEFAULT_BREAKPOINTS, ...opts }
}

export function reset(): void {
  Object.assign(state, initial())
}

let readyDeferred: { promise: Promise<void>; resolve: () => void } | null = null

export function newReadyDeferred(): void {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  readyDeferred = { promise, resolve }
}

export function getReadyPromise(): Promise<void> {
  return readyDeferred ? readyDeferred.promise : Promise.resolve()
}

export function resolveReady(): void {
  readyDeferred?.resolve()
}

export function addDisposer(fn: () => void): void {
  state.disposers.push(fn)
}

export function runAllDisposers(): void {
  while (state.disposers.length > 0) {
    const fn = state.disposers.pop()
    if (!fn) continue
    try {
      fn()
    } catch (err) {
      console.error('[alrdy-animate] disposer threw', err)
    }
  }
}
