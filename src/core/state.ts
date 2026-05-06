import type { Breakpoints, InitOptions } from '../types/index'

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  sm: 480,
  md: 768,
  lg: 992,
  xl: 1280,
}

/**
 * Single source of truth for init-time defaults. Features must NOT carry
 * their own per-animation duration / ease fallbacks — they always pull from
 * `ctx.options`, which has these merged in.
 */
export const DEFAULT_OPTIONS: Required<
  Pick<InitOptions, 'duration' | 'ease' | 'distance' | 'scrollStart' | 'scrollEnd' | 'again'>
> = {
  duration: 0.6,
  ease: 'power4.out',
  distance: 1,
  scrollStart: 'top 92%',
  scrollEnd: 'bottom 70%',
  again: true,
}

export function resolveOptions(opts: InitOptions): InitOptions {
  return { ...DEFAULT_OPTIONS, ...opts }
}

export interface InternalState {
  initialized: boolean
  options: InitOptions
  breakpoints: Breakpoints
  disposers: Array<() => void>
}

const initial = (): InternalState => ({
  initialized: false,
  options: {},
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
