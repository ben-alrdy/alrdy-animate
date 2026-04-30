import type { Breakpoints, InitOptions } from '../types/index'

export const DEFAULT_BREAKPOINTS: Breakpoints = {
  sm: 480,
  md: 768,
  lg: 992,
  xl: 1280,
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
