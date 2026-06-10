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
   * GSAP ease string (`"power2.out"`, `"expo.inOut"`) or one of the named
   * eases the lib registers via CustomEase on init:
   * `osmo` | `energy` | `smooth` | `punch` | `relaxed` | `jump` | `pop` |
   * `elastic` | `anticipate` | `bounce` | `fade`. Canonical list in
   * `src/core/named-eases.ts`. Named eases require `CustomEase` loaded.
   * Default `"power4.out"`.
   */
  ease?: string
  /**
   * Global intensity multiplier for every feature that scales by `aa-intensity`.
   * `1` reproduces each feature's design-baseline default; `0.5` halves, `2`
   * doubles. Per-element override: `aa-intensity`. Default `1`.
   *
   * Baselines by family:
   *
   * - **fade-\* / rotate-up translate** — `2rem` (root font-size relative).
   * - **text-blur (all directions)** — `2rem` (root font-size relative).
   * - **slide-\* / text-slide-\* / text-tilt-\* / hover-bg-block** — element-relative
   *   (`100%` of element or line); scales with element size, not root font-size.
   * - **parallax / parallax-horizontal** — `±10%` of the parallax range.
   * - **marquee scrub** — `±10vw` (viewport-relative).
   * - **rotate** — `5°`. **stack** — preset-baked rotation / scale / blur /
   *   translate. **hover-icon trail / nav / tabs scroll-pin** — internal
   *   timing or geometry constants.
   *
   * The rem-based families track the root font-size at tween-creation time;
   * the lib rebuilds tweens on breakpoint changes, so a stepped
   * `:root { font-size }` swap per breakpoint is picked up automatically.
   */
  intensity?: number
  /**
   * Seconds added to the delay of every `aa-trigger="load"` and
   * `aa-trigger="load-once"` entrance. Load entrances are *paint-gated*: built
   * paused and released one frame after `init()` reveals them, so a wall-clock
   * GSAP tween can't advance during the heavy post-init layout/paint block and
   * surface the entrance already mid-fade (the symptom on content-heavy pages).
   * `loadDelay` then adds an intentional beat on top, measured from that first
   * paint. Added on top of any per-element `aa-delay` — set `aa-delay="0.3"`
   * with `loadDelay: 0.1` and the load animation fires `0.4s` after paint.
   * Default `0`: paint-gating alone handles "wait for settle", so the entrance
   * starts the moment it's painted; set a positive value to delay it by a
   * deliberate beat.
   *
   * Skipped when the slow-network fallback fired (`html[aa-fallback]`) —
   * those load animations don't run anyway, and adding more delay on revisit
   * inits would make a slow-load page feel slower. Scroll / event / click /
   * scrub triggers are unaffected.
   */
  loadDelay?: number
  /**
   * Default ScrollTrigger `start`. Standard GSAP syntax (`"top 80%"`,
   * `"center 50%"`). Used by every scroll-triggered animation. Default `"top 85%"`.
   */
  scrollStart?: string
  /**
   * Default ScrollTrigger `end`. Only used when `aa-scrub` is set (scrubbed
   * animations need a start AND end to map progress onto). Non-scrubbed
   * animations ignore this — they fire on enter and, when `again: true`, reset
   * once the element fully leaves the viewport (computed dynamically, not from
   * `scrollEnd`). Default `"bottom 60%"`.
   */
  scrollEnd?: string
  /**
   * Optional `start` override applied **only** when `aa-scrub` is set on the
   * element. Lets you fire scrubbed animations earlier than the snappier
   * non-scrubbed `scrollStart` — e.g. `scrollStart: 'top 85%'` for entrances,
   * `scrubStart: 'top 100%'` to give scrubs the full viewport pass. Per-element
   * `aa-scroll-start` still wins. Honoured by every scroll-position-reading
   * feature (appear / text / reveal / reduced-motion).
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
   * Class-name → animation presets, applied at init time. Each entry maps a
   * CSS class to one or more `aa-*` attributes that get virtually attached
   * to matching elements during scan. Lets you set animations once globally
   * instead of adding `aa-*` attributes to every heading in a Webflow project.
   *
   * Resolved into an in-memory `Map<Element, Config>` — no DOM mutation, no
   * inspector pollution, no interaction with the FOUC CSS guard.
   *
   * Value forms:
   * - **String** — shorthand for `{ animate: <value> }`. e.g. `'text-fade-up'`.
   * - **Object** — bare keys are prefixed with `aa-`. e.g. `{ animate: 'text-fade-up', split: 'words', duration: '0.8|0.5' }`.
   *   Pipe variants and Tailwind-style suffix keys work just like in HTML
   *   (`'animate-md'` becomes virtual `aa-animate-md`).
   *
   * **Per-element override**: if a matched element already has any `aa-*`
   * attribute, the preset is skipped for that element. The explicit attribute
   * always wins. To opt a single element out of a preset, give it any `aa-*`
   * attribute.
   *
   * **Resolution order**: object insertion order. The first preset entry that
   * matches an element wins; later entries don't merge.
   *
   * **Scope**: each preset must include an `animate` value (or a per-breakpoint
   * variant like `animate-md`). Presets without one are skipped. Intended for
   * text (`text-*`) and appear (`fade-*`, `zoom-*`, `slide-*`, `blur-in`,
   * `rotate-*`) animations.
   *
   * **Reduced motion + optimizeMobile**: preset elements route through the
   * same fade-fallback pass as hand-authored attributes — no extra wiring.
   *
   * **FOUC**: the CSS hide-until-`aa-ready` guard does NOT cover preset
   * elements (they have no `aa-animate` on first paint). Use presets for
   * below-the-fold content; hand-author `aa-animate` on anything above the
   * fold so the guard catches it.
   *
   * Example:
   * ```ts
   * init({
   *   presets: {
   *     'heading-style-h2': 'text-fade-up',
   *     'heading-style-h3': { animate: 'text-blur-up', split: 'words' },
   *     'cta-button': { animate: 'fade-up', duration: '0.4|0.3' }
   *   }
   * })
   * ```
   */
  presets?: Record<string, string | Record<string, string>>
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
  intensity: number
  loadDelay: number
  scrollStart: string
  scrollEnd: string
  again: boolean
  stagger: StaggerOptions
  autoplay: AutoplayOptions
  breakpoints: Breakpoints
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
  /**
   * Resolved options snapshot — every `InitOptions` field with defaults
   * filled in. After `await ready()`, `reducedMotion` and `optimizeMobile`
   * are collapsed to the plain booleans the lib actually uses internally
   * (reflecting OS preference + viewport detection, not the user-passed
   * setting shape).
   *
   * Use from project-specific GSAP scripts to stay in sync with the library
   * instead of re-detecting:
   *   const { reducedMotion, optimizeMobile, breakpoints, duration, ease } =
   *     AlrdyAnimate.options
   *   const DURATION = reducedMotion ? 0.01 : duration
   *
   * Reads always reflect the most recent `init()`. Treat as read-only —
   * mutating fields here will not affect the running lib.
   */
  options: ResolvedOptions
  /**
   * Resolves after the most recent `init()` has finished mounting features
   * and registering plugins/eases. Resolves immediately when called before
   * any init, or after the previous init has already completed.
   *
   * Use from project-specific GSAP scripts that load alongside v8 and need
   * to wait for plugin + named-ease registration before running:
   *
   *   await AlrdyAnimate.ready()
   *   gsap.to(el, { ease: 'smooth' })  // 'smooth' registered by init()
   *
   * Each new `init()` (or `refresh()`) creates a fresh promise so re-inits
   * can also be awaited.
   */
  ready: () => Promise<void>
}
