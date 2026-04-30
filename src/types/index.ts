export interface Breakpoints {
  sm: number
  md: number
  lg: number
  xl: number
}

export interface SmoothScrollOptions {
  lerp?: number
  wheelMultiplier?: number
  touchMultiplier?: number
  smoothWheel?: boolean
  syncTouch?: boolean
}

export interface ReducedMotionOptions {
  duration: number
  ease: string
}

export interface InitOptions {
  duration?: number
  ease?: string
  distance?: number
  scrollStart?: string
  scrollEnd?: string
  again?: boolean
  breakpoints?: Partial<Breakpoints>
  reducedMotion?: ReducedMotionOptions
  smoothScroll?: boolean | SmoothScrollOptions
  debug?: boolean
}

export interface OnResizeOptions {
  debounce?: number
}

export type ResizeCallback = () => void
export type ResizeUnsubscribe = () => void

export interface PublicApi {
  init: (options?: InitOptions) => void
  destroy: () => void
  refresh: () => void
  onResize: (fn: ResizeCallback, opts?: OnResizeOptions) => ResizeUnsubscribe
}
