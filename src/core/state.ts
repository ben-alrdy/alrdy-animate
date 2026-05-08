import type {
  AutoplayOptions,
  Breakpoints,
  InitOptions,
  ResolvedOptions,
  StaggerOptions,
} from '../types/index'

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
  scrollStart: 'top 92%',
  scrollEnd: 'bottom 70%',
  again: true,
  stagger: DEFAULT_STAGGER,
  autoplay: DEFAULT_AUTOPLAY,
  smoothScroll: true,
  scrollState: true,
}

export function resolveOptions(opts: InitOptions): ResolvedOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...opts,
    stagger: { ...DEFAULT_STAGGER, ...opts.stagger },
    autoplay: { ...DEFAULT_AUTOPLAY, ...opts.autoplay },
  }
}

export interface InternalState {
  initialized: boolean
  options: ResolvedOptions
  breakpoints: Breakpoints
  disposers: Array<() => void>
}

const initial = (): InternalState => ({
  initialized: false,
  options: { ...DEFAULT_OPTIONS },
  breakpoints: { ...DEFAULT_BREAKPOINTS },
  disposers: [],
})

export const state: InternalState = initial()

export function resolveBreakpoints(opts: InitOptions['breakpoints']): Breakpoints {
  return { ...DEFAULT_BREAKPOINTS, ...opts }
}

export function reset(): void {
  Object.assign(state, initial())
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
