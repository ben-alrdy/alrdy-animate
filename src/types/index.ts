export interface Breakpoints {
  sm: number
  md: number
  lg: number
  xl: number
}

/**
 * Lenis options. Common ones are typed for autocomplete; any other Lenis
 * option (orientation, infinite, easing, autoRaf, etc.) can be passed through.
 * See https://github.com/darkroomengineering/lenis#instance-options
 */
export interface SmoothScrollOptions {
  lerp?: number
  wheelMultiplier?: number
  touchMultiplier?: number
  smoothWheel?: boolean
  syncTouch?: boolean
  [key: string]: unknown
}

export interface ReducedMotionOptions {
  duration: number
  ease: string
}

/**
 * Stagger defaults keyed by split mode. Features pick the value matching the
 * resolved aa-split (chars/words/lines); aa-children with no split falls back
 * to `default`. Override per-element via aa-stagger.
 */
export interface StaggerOptions {
  chars: number
  words: number
  lines: number
  default: number
}

/**
 * Autoplay defaults shared by slider and tabs. Override per-element via
 * aa-autoplay="<seconds> [hover-pause]".
 */
export interface AutoplayOptions {
  interval: number
  hoverPause: boolean
}

export interface InitOptions {
  duration?: number
  ease?: string
  distance?: number
  scrollStart?: string
  scrollEnd?: string
  scrubStart?: string
  again?: boolean
  stagger?: Partial<StaggerOptions>
  autoplay?: Partial<AutoplayOptions>
  breakpoints?: Partial<Breakpoints>
  reducedMotion?: ReducedMotionOptions
  smoothScroll?: boolean | SmoothScrollOptions
  /**
   * Body scroll-state tracking: writes `aa-scroll-direction="up|down"` and
   * `aa-scroll-started="true|false"` on `<body>`, and runs the
   * `[aa-toggle-playstate]` IntersectionObserver. Pass `false` to opt out.
   */
  scrollState?: boolean
  /**
   * Subtree to scan for `aa-*` elements. Defaults to `document`. Pass a
   * specific element to scope a re-init to that subtree — useful for page
   * transition libraries (Barba, View Transitions) that swap a container in
   * while leaving the rest of the page intact.
   *
   * Element-scoped inits skip the global once-per-app setup (smoothScroll,
   * scrollState, scrollTarget) — those stay tied to the original full-page
   * init.
   */
  root?: ParentNode
  debug?: boolean
}

/**
 * Init options after resolveOptions() has merged DEFAULT_OPTIONS: every field
 * features rely on for defaults is guaranteed present and fully populated.
 */
export interface ResolvedOptions extends InitOptions {
  duration: number
  ease: string
  distance: number
  scrollStart: string
  scrollEnd: string
  again: boolean
  stagger: StaggerOptions
  autoplay: AutoplayOptions
  smoothScroll: boolean | SmoothScrollOptions
  scrollState: boolean
}

export interface OnResizeOptions {
  debounce?: number
}

export type ResizeCallback = () => void
export type ResizeUnsubscribe = () => void

export interface DestroyApiOptions {
  /**
   * Skip teardown of app-global handles (Lenis smooth scroll, body
   * scroll-state observer, scroll-target observer). They're bound to
   * elements that survive route changes, so page-transition libraries can
   * destroy + re-init per page without re-creating them.
   */
  keepGlobals?: boolean
}

export interface PublicApi {
  init: (options?: InitOptions) => void
  destroy: (options?: DestroyApiOptions) => void
  refresh: () => void
  onResize: (fn: ResizeCallback, opts?: OnResizeOptions) => ResizeUnsubscribe
}
