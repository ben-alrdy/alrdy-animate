/**
 * Pixel widths at which a `min-width` media query flips. Used by the responsive
 * resolver: `aa-foo-md` activates at `>= breakpoints.md`, the `|` shorthand on
 * `aa-foo="A | B"` puts A on `>= breakpoints.md` and B below it.
 *
 * Defaults: `{ sm: 480, md: 768, lg: 992, xl: 1280 }`. Override via
 * `init({ breakpoints: { md: 900 } })`.
 */
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

/**
 * Reduced-motion fallback applied under `(prefers-reduced-motion: reduce)`.
 * When active, every appear/text/reveal animation collapses to a simple
 * opacity fade with these timing values; hover and parallax features skip
 * entirely; tabs/slider/marquee/nav/modal stay functional.
 *
 * Defaults: `{ duration: 0.4, ease: 'power1.out' }`.
 */
export interface ReducedMotionOptions {
  duration: number
  ease: string
}

/**
 * Stagger defaults keyed by split mode. Features pick the value matching the
 * resolved aa-split (chars/words/lines); aa-children with no split falls back
 * to `default`. Override per-element via `aa-stagger`.
 *
 * Defaults: `{ chars: 0.02, words: 0.05, lines: 0.1, default: 0.1 }` (seconds).
 */
export interface StaggerOptions {
  chars: number
  words: number
  lines: number
  default: number
}

/**
 * Autoplay defaults shared by slider and tabs. Override per-element via
 * `aa-autoplay="<seconds> [hover-pause]"` (e.g. `aa-autoplay="3 hover-pause"`).
 *
 * Defaults: `{ interval: 4, hoverPause: false }`.
 */
export interface AutoplayOptions {
  interval: number
  hoverPause: boolean
}

/**
 * Options accepted by `init()`. Every field is optional — unspecified fields
 * fall back to `DEFAULT_OPTIONS` (`src/core/state.ts`). Use this type when
 * exposing a typed init wrapper to your app code.
 */
export interface InitOptions {
  /** Default tween duration in seconds for animations that don't set `aa-duration`. Default `0.6`. */
  duration?: number
  /**
   * Default ease curve for animations that don't set `aa-ease`. Accepts any
   * GSAP ease string (`"power2.out"`, `"expo.inOut"`) or a named ease registered
   * by the lib via CustomEase: `smooth` | `snappy` | `bounce` | `expressive` | `sharp`.
   * Default `"power4.out"`.
   */
  ease?: string
  /**
   * Multiplier applied to the default translate distance for fade-up / fade-down /
   * fade-left / fade-right and slide-* animations. `1` is the design baseline
   * (3rem for fade variants, 100% for slide variants). Default `1`.
   */
  distance?: number
  /**
   * Default ScrollTrigger `start` for non-scrubbed animations. Standard GSAP
   * syntax (`"top 80%"`, `"center 50%"`). Default `"top 92%"`.
   */
  scrollStart?: string
  /**
   * Default ScrollTrigger `end` for non-scrubbed animations. Default `"bottom 70%"`.
   * Used for animations that reverse on scroll-out (`again: true`).
   */
  scrollEnd?: string
  /**
   * Default ScrollTrigger `start` when `aa-scrub` is set. Pinning the scrub start
   * higher than `scrollStart` prevents premature scrub of off-screen elements.
   */
  scrubStart?: string
  /**
   * When true, scroll-triggered animations replay every time their trigger
   * re-enters the viewport. When false, they play once and stay finished.
   * Default `true`.
   */
  again?: boolean
  /** Per-split-mode stagger defaults. Merged into `DEFAULT_OPTIONS.stagger`. */
  stagger?: Partial<StaggerOptions>
  /** Slider/tabs autoplay defaults. Merged into `DEFAULT_OPTIONS.autoplay`. */
  autoplay?: Partial<AutoplayOptions>
  /**
   * Override the responsive breakpoints. Pass any subset, e.g.
   * `{ md: 900 }`. Defaults to `{ sm: 480, md: 768, lg: 992, xl: 1280 }`.
   */
  breakpoints?: Partial<Breakpoints>
  /**
   * Behaviour under `(prefers-reduced-motion: reduce)`. Default `true`.
   *
   * - `true` — appear/text/reveal animations collapse to a simple opacity fade
   *   (`{ duration: 0.4, ease: 'power1.out' }`); hover and parallax features
   *   skip entirely; tabs/slider/marquee/nav/modal stay functional.
   * - `false` — ignore the user's preference; every animation runs normally.
   * - object — `true` behaviour with custom fade timing,
   *   e.g. `{ duration: 0.3, ease: 'linear' }`.
   *
   * Snapshot at init time. Toggle the OS preference and the next `init()` /
   * `refresh()` picks it up.
   */
  reducedMotion?: boolean | ReducedMotionOptions
  /**
   * Drop the heaviest decorative features on small viewports for a faster
   * mobile experience. Default `false`. When `true` and the viewport is below
   * `breakpoints.md` (default 768px):
   *
   * - `text-*` animations collapse to a simple opacity fade (SplitText is not
   *   loaded; per-char/word/line spans are not created).
   * - `parallax` / `parallax-horizontal` are skipped entirely — elements
   *   render at their natural position.
   * - The standalone `aa-split` utility is a no-op (text stays un-split).
   *
   * Everything else (fade-up, zoom-in, slide-*, rotate, blur, reveal, hover,
   * tabs, slider, marquee, nav, modal, cursor) runs normally. Snapshotted at
   * init — resize past the breakpoint and call `refresh()` to re-evaluate.
   */
  optimizeMobile?: boolean
  /**
   * Smooth scroll via Lenis. `true` (default) creates a Lenis instance with
   * library defaults; pass an options object to forward Lenis options
   * (`lerp`, `wheelMultiplier`, `orientation`, etc.); pass `false` to disable.
   * If the Lenis script/package isn't loaded, the option is silently skipped
   * and a dev-mode warning is printed.
   */
  smoothScroll?: boolean | SmoothScrollOptions
  /**
   * Body scroll-state tracking: writes `aa-scroll-direction="up|down"` and
   * `aa-scroll-started="true|false"` on `<body>`, and runs the
   * `[aa-toggle-playstate]` IntersectionObserver. Default `true`. Pass `false`
   * to opt out.
   */
  scrollState?: boolean
  /**
   * Subtree to scan for `aa-*` elements. Defaults to `document`. Pass a
   * specific element to scope a re-init to that subtree — useful for page
   * transition libraries (Barba, View Transitions) that swap a container in
   * while leaving the rest of the page intact.
   *
   * Element-scoped inits skip the global once-per-app setup (`smoothScroll`,
   * `scrollState`, `scrollTarget`) — those stay tied to the original full-page
   * init.
   */
  root?: ParentNode
  /**
   * Verbose dev-mode console logging. Logs the active feature set, detected
   * GSAP plugins, missing-plugin warnings, and the Lenis status line. Default
   * `false`.
   */
  debug?: boolean
}

/**
 * Init options after `resolveOptions()` has merged `DEFAULT_OPTIONS`: every
 * field features rely on for defaults is guaranteed present and fully populated.
 * Internal — features receive this on `ctx.options`, but consumers always pass
 * the looser `InitOptions` to `init()`.
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
  reducedMotion: boolean | ReducedMotionOptions
  optimizeMobile: boolean
}

/**
 * Options for `onResize(fn, opts)`. The shared bus debounces the native
 * `resize` event and fans out to every subscriber.
 */
export interface OnResizeOptions {
  /** Debounce window in milliseconds before firing subscribers. Default `150`. */
  debounce?: number
}

export type ResizeCallback = () => void
export type ResizeUnsubscribe = () => void

/**
 * Options accepted by `destroy()`. Both flags default to `false` (full
 * teardown for app-level unmount). Together they make page-transition wiring
 * possible without flicker — see the Barba/Next.js recipes in `docs/recipes/`.
 */
export interface DestroyApiOptions {
  /**
   * When `true`, leave Lenis, scroll-state, and scroll-target observers alive
   * across the destroy/init cycle. The next `init()` call reuses the same
   * instances instead of creating fresh ones — preserves scroll position and
   * avoids re-instantiating Lenis on every Barba/View Transitions navigation.
   * Default `false`.
   */
  keepGlobals?: boolean
  /**
   * When `true`, skip clearing the inline GSAP from-states (`opacity:0`,
   * `transform: translateY(...)`, `filter: blur(...)`) that scroll-triggered
   * animations write to elements until their trigger fires. Default `false`
   * reverts via `gsap.matchMedia.revert()` (calls `clearProps` and snaps
   * un-fired animations to their natural visible state) — visible as a flash
   * of content if the leaving DOM is still on screen during a page transition.
   *
   * With `true`, tweens and ScrollTriggers are killed without reverting, so
   * elements stay frozen where GSAP left them until the host removes the
   * leaving container. Pair only with a page-transition leave hook that
   * removes the wrapper shortly after — using this on long-lived DOM would
   * freeze elements indefinitely.
   */
  keepFromStates?: boolean
}

/**
 * The public surface exposed at `window.AlrdyAnimate` (UMD) and as named
 * exports from `'alrdy-animate'` (ESM). These are the only hooks needed to
 * wire alrdy-animate into Barba, View Transitions, or any other page-transition
 * library — see the recipes in `docs/recipes/` for full examples.
 */
export interface PublicApi {
  /**
   * Scan the DOM (or `options.root` subtree), apply from-states, register
   * scroll triggers and event listeners. Idempotent — calling `init()` on an
   * already-initialised app is a no-op. Resolves once feature modules have
   * finished mounting; await it from page-specific scripts that depend on
   * Lenis being mounted or named eases being registered.
   */
  init: (options?: InitOptions) => Promise<void>
  /**
   * Tear down. By default reverts inline from-states and disposes Lenis +
   * scroll observers. Pass `{ keepGlobals: true }` from page-transition hooks
   * to keep Lenis alive across the destroy/init cycle, and/or `{ keepFromStates: true }`
   * to keep elements frozen mid-animation while the leaving wrapper is still
   * on screen.
   */
  destroy: (options?: DestroyApiOptions) => void
  /** Shorthand for `destroy()` followed by `init()` with the previous options. */
  refresh: () => Promise<void>
  /**
   * Subscribe to a shared debounced `resize` bus. Returns an unsubscribe
   * function. Multiple subscribers share one underlying listener so adding
   * resize-aware components stays cheap.
   */
  onResize: (fn: ResizeCallback, opts?: OnResizeOptions) => ResizeUnsubscribe
}
