/**
 * Ambient JSX types for `aa-*` attributes. Import once anywhere that's
 * compiled — typically `types/global.d.ts` or the top of your root layout:
 *
 * ```ts
 * import 'alrdy-animate/jsx'
 * ```
 *
 * Every JSX intrinsic element then accepts the documented `aa-*` attributes
 * with autocomplete and on-hover JSDoc. The same attribute names are read at
 * runtime by `init()`; the JSDoc here is the authoritative reference for what
 * each value means.
 *
 * **Attribute-value syntax (every value-bearing attribute):**
 *
 * - **Dashes** join one concept (`fade-up`, `text-blur-up`, `hover-bg-block`).
 * - **Spaces** separate independent flags on the same attribute
 *   (`aa-split="lines mask"`, `aa-trigger="load event:enter"`).
 * - **Pipe `|`** is a 2-bucket responsive shorthand: `"DESKTOP | MOBILE"`.
 *   Left-of-pipe applies at `>= breakpoints.md` (default 768px), right applies
 *   below it. Example: `aa-animate="fade-up | fade"` runs `fade-up` on desktop,
 *   `fade` on mobile.
 * - **`-sm` / `-md` / `-lg` / `-xl` suffixes** override at the named breakpoint
 *   and up (Tailwind semantics). Default breakpoints: 480/768/992/1280px.
 * - **Value `none`** opts out at that breakpoint (e.g. `aa-slider="snap | none"`
 *   disables the slider on mobile entirely).
 */

declare namespace JSX {
  interface AlrdyAnimateAttributes {
    /**
     * Animation preset. The presence of this attribute is what makes an
     * element animate at all (the FOUC guard hides anything with `aa-animate`
     * until `init()` flips `aa-ready` on it).
     *
     * **Scroll/load/event presets** (feature: `scroll`):
     * `fade` | `fade-up` | `fade-down` | `fade-left` | `fade-right` |
     * `zoom-in` | `zoom-out` | `slide-up` | `slide-down` | `slide-left` |
     * `slide-right` | `blur` | `rotate-*` (rotate, rotate-up, rotate-up-tl/tr/bl/br, rotate-ccw variants)
     *
     * **Text presets** (feature: `text`, requires `SplitText`):
     * `text-fade` | `text-fade-up` | `text-fade-down` | `text-slide-up` |
     * `text-slide-down` | `text-scale` | `text-scale-up` | `text-scale-down` |
     * `text-blur` | `text-blur-up` | `text-tilt` | `text-rotate` |
     * `text-marker` | `text-oval` | `text-block`. Pair with `aa-split` to
     * control granularity.
     *
     * **Reveal presets** (feature: `reveal`): `reveal` | `reveal-slices` —
     * clip-path entrances controlled by `aa-scroll-start/end` or `aa-scrub`.
     *
     * Combine with `aa-trigger`, `aa-duration`, `aa-delay`, `aa-ease`,
     * `aa-distance`, `aa-stagger` to tune the playback. Use `none` at a
     * breakpoint to skip animating there.
     */
    'aa-animate'?: string
    /** Breakpoint variant of `aa-animate`. Activates at `>= breakpoints.sm` (default 480px). Same accepted values; use `none` to opt out. */
    'aa-animate-sm'?: string
    /** Breakpoint variant of `aa-animate`. Activates at `>= breakpoints.md` (default 768px). Same accepted values; use `none` to opt out. */
    'aa-animate-md'?: string
    /** Breakpoint variant of `aa-animate`. Activates at `>= breakpoints.lg` (default 992px). Same accepted values; use `none` to opt out. */
    'aa-animate-lg'?: string
    /** Breakpoint variant of `aa-animate`. Activates at `>= breakpoints.xl` (default 1280px). Same accepted values; use `none` to opt out. */
    'aa-animate-xl'?: string

    /**
     * What fires the animation. Values:
     *
     * - `scroll` (default if attribute is absent) — ScrollTrigger between
     *   `aa-scroll-start` and `aa-scroll-end`. Replays on re-enter unless
     *   `init({ again: false })`.
     * - `click` — element animates when clicked. The element itself becomes
     *   the click target.
     * - `load` — fires on the very first `init()` cycle of the page session.
     *   Subsequent `init()`s (e.g. after a Barba navigation) skip it. Pair with
     *   the slow-network fallback recipe in `docs/recipes/load-fallback/`.
     * - `event:<name>` — listens for `aa:trigger` custom events with
     *   `detail.name === '<name>'` dispatched on the element or any ancestor.
     *   Names ending in `-active` auto-pair with `-inactive` for reverse.
     *
     * **Multiple triggers** are space-separated, e.g.
     * `aa-trigger="load event:enter"` (load on first init, then re-fire on
     * `event:enter` thereafter).
     *
     * **Container inference** — if this attribute is omitted and the element is
     * inside `[aa-modal-name]`, `[aa-tabs-content]`, `[aa-tabs-visual]`, or
     * `[aa-slider-item]`, the trigger defaults to the matching event
     * (`event:modal-active` / `event:tab-active` / `event:slide-active`).
     * Set `aa-trigger="scroll"` explicitly to opt out of inference.
     *
     * **Dispatching custom events** from your code:
     * `el.dispatchEvent(new CustomEvent('aa:trigger', { detail: { name: 'foo' }, bubbles: true }))`.
     */
    'aa-trigger'?: string
    /** Breakpoint variant of `aa-trigger`. Activates at `>= breakpoints.sm`. */
    'aa-trigger-sm'?: string
    /** Breakpoint variant of `aa-trigger`. Activates at `>= breakpoints.md`. */
    'aa-trigger-md'?: string
    /** Breakpoint variant of `aa-trigger`. Activates at `>= breakpoints.lg`. */
    'aa-trigger-lg'?: string
    /** Breakpoint variant of `aa-trigger`. Activates at `>= breakpoints.xl`. */
    'aa-trigger-xl'?: string

    /**
     * How to split text before animating. Values (space-separated, order doesn't
     * matter):
     *
     * - `chars` | `words` | `lines` — the unit to split into.
     * - `mask` — wrap each split unit in a clipping mask (typical for
     *   `text-slide-*` and `text-blur-up`).
     *
     * Examples: `aa-split="lines"`, `aa-split="lines mask"`, `aa-split="chars"`.
     *
     * Required by every `text-*` preset (feature: `text`, plugin: `SplitText`).
     * Also usable as a standalone utility on plain elements via the `split`
     * runtime — see `aa-split` docs for the standalone behaviour.
     */
    'aa-split'?: string
    /** Breakpoint variant of `aa-split`. Activates at `>= breakpoints.sm`. */
    'aa-split-sm'?: string
    /** Breakpoint variant of `aa-split`. Activates at `>= breakpoints.md`. */
    'aa-split-md'?: string
    /** Breakpoint variant of `aa-split`. Activates at `>= breakpoints.lg`. */
    'aa-split-lg'?: string
    /** Breakpoint variant of `aa-split`. Activates at `>= breakpoints.xl`. */
    'aa-split-xl'?: string

    /**
     * Per-step delay (seconds) when staggering across split units or direct
     * children. Negative values reverse the stagger order. If `aa-stagger` is
     * present without `aa-split` and the element has direct children, the
     * children are staggered.
     *
     * Defaults vary by split mode: chars `0.02`, words `0.05`, lines `0.1`,
     * default `0.1`. Override via `init({ stagger: { chars: 0.04 } })`.
     */
    'aa-stagger'?: string | number
    /** Breakpoint variant of `aa-stagger`. Activates at `>= breakpoints.sm`. */
    'aa-stagger-sm'?: string | number
    /** Breakpoint variant of `aa-stagger`. Activates at `>= breakpoints.md`. */
    'aa-stagger-md'?: string | number
    /** Breakpoint variant of `aa-stagger`. Activates at `>= breakpoints.lg`. */
    'aa-stagger-lg'?: string | number
    /** Breakpoint variant of `aa-stagger`. Activates at `>= breakpoints.xl`. */
    'aa-stagger-xl'?: string | number

    /** Tween duration in seconds. Overrides `init({ duration })` (default `0.6`) for this element. */
    'aa-duration'?: string | number
    /** Breakpoint variant of `aa-duration`. Activates at `>= breakpoints.sm`. */
    'aa-duration-sm'?: string | number
    /** Breakpoint variant of `aa-duration`. Activates at `>= breakpoints.md`. */
    'aa-duration-md'?: string | number
    /** Breakpoint variant of `aa-duration`. Activates at `>= breakpoints.lg`. */
    'aa-duration-lg'?: string | number
    /** Breakpoint variant of `aa-duration`. Activates at `>= breakpoints.xl`. */
    'aa-duration-xl'?: string | number

    /** Delay in seconds before the tween starts. Default `0`. Combines additively with stagger. */
    'aa-delay'?: string | number
    /** Breakpoint variant of `aa-delay`. Activates at `>= breakpoints.sm`. */
    'aa-delay-sm'?: string | number
    /** Breakpoint variant of `aa-delay`. Activates at `>= breakpoints.md`. */
    'aa-delay-md'?: string | number
    /** Breakpoint variant of `aa-delay`. Activates at `>= breakpoints.lg`. */
    'aa-delay-lg'?: string | number
    /** Breakpoint variant of `aa-delay`. Activates at `>= breakpoints.xl`. */
    'aa-delay-xl'?: string | number

    /**
     * Ease curve. Accepts any GSAP ease string (`"power2.out"`, `"expo.inOut"`,
     * `"back.out(1.7)"`) or one of the named eases registered by the lib via
     * `CustomEase`: `osmo` | `energy` | `smooth` | `punch` | `relaxed` |
     * `jump` | `pop` | `elastic` | `anticipate` | `bounce` | `fade`.
     * Overrides `init({ ease })` (default `"power4.out"`).
     */
    'aa-ease'?: string
    /** Breakpoint variant of `aa-ease`. Activates at `>= breakpoints.sm`. */
    'aa-ease-sm'?: string
    /** Breakpoint variant of `aa-ease`. Activates at `>= breakpoints.md`. */
    'aa-ease-md'?: string
    /** Breakpoint variant of `aa-ease`. Activates at `>= breakpoints.lg`. */
    'aa-ease-lg'?: string
    /** Breakpoint variant of `aa-ease`. Activates at `>= breakpoints.xl`. */
    'aa-ease-xl'?: string

    /**
     * Distance multiplier for translate-based presets (`fade-up/down/left/right`,
     * `slide-up/down/left/right`). `1` = baseline (3rem for fades, 100% for
     * slides); `2` = doubled, `0.5` = halved. Overrides `init({ distance })`.
     */
    'aa-distance'?: string | number
    /** Breakpoint variant of `aa-distance`. Activates at `>= breakpoints.sm`. */
    'aa-distance-sm'?: string | number
    /** Breakpoint variant of `aa-distance`. Activates at `>= breakpoints.md`. */
    'aa-distance-md'?: string | number
    /** Breakpoint variant of `aa-distance`. Activates at `>= breakpoints.lg`. */
    'aa-distance-lg'?: string | number
    /** Breakpoint variant of `aa-distance`. Activates at `>= breakpoints.xl`. */
    'aa-distance-xl'?: string | number

    /**
     * ScrollTrigger `start`. Standard GSAP syntax — `"top 80%"`, `"center 50%"`,
     * `"top top"`. Default `init({ scrollStart })` is `"top 85%"`.
     */
    'aa-scroll-start'?: string
    /** Breakpoint variant of `aa-scroll-start`. Activates at `>= breakpoints.sm`. */
    'aa-scroll-start-sm'?: string
    /** Breakpoint variant of `aa-scroll-start`. Activates at `>= breakpoints.md`. */
    'aa-scroll-start-md'?: string
    /** Breakpoint variant of `aa-scroll-start`. Activates at `>= breakpoints.lg`. */
    'aa-scroll-start-lg'?: string
    /** Breakpoint variant of `aa-scroll-start`. Activates at `>= breakpoints.xl`. */
    'aa-scroll-start-xl'?: string

    /**
     * ScrollTrigger `end`. Only used when `aa-scrub` is set — scrubbed
     * animations need a start AND end to map progress onto. Non-scrubbed
     * animations ignore this; they fire on enter and (with `init({ again })`)
     * reset once the element fully leaves the viewport, computed dynamically.
     * Default `init({ scrollEnd })` is `"bottom 60%"`.
     */
    'aa-scroll-end'?: string
    /** Breakpoint variant of `aa-scroll-end`. Activates at `>= breakpoints.sm`. */
    'aa-scroll-end-sm'?: string
    /** Breakpoint variant of `aa-scroll-end`. Activates at `>= breakpoints.md`. */
    'aa-scroll-end-md'?: string
    /** Breakpoint variant of `aa-scroll-end`. Activates at `>= breakpoints.lg`. */
    'aa-scroll-end-lg'?: string
    /** Breakpoint variant of `aa-scroll-end`. Activates at `>= breakpoints.xl`. */
    'aa-scroll-end-xl'?: string

    /**
     * Scrub the animation to scroll position. Accepts a number (smoothing
     * factor in seconds — `0.5` is a typical scrub) or `true` for instant
     * (no smoothing). When set, the animation plays between `aa-scroll-start`
     * and `aa-scroll-end` instead of firing once at the start.
     */
    'aa-scrub'?: string | number

    /**
     * CSS selector for the element whose viewport position drives this
     * animation's ScrollTrigger. Defaults to the animated element itself —
     * use this to anchor a deep-nested element to the section/wrapper that
     * actually defines the scroll moment.
     */
    'aa-anchor'?: string

    /**
     * Parallax start depth. Numeric multiplier, no unit. `0` = element doesn't
     * move (locked to viewport scroll); `1` = element moves at scroll speed
     * (i.e. no parallax); `0.5` = element moves at half speed (lags behind);
     * `-0.5` = element moves opposite the scroll direction. Pairs with
     * `aa-parallax-end` to define the depth across the scroll range.
     * Feature: `parallax`, plugin: `ScrollTrigger`.
     */
    'aa-parallax-start'?: string | number
    /** Parallax end depth. See `aa-parallax-start` for the value meaning. */
    'aa-parallax-end'?: string | number

    /**
     * Autoplay configuration for `aa-slider` and `aa-tabs`. Values:
     *
     * - `<seconds>` — interval between auto-advances (e.g. `"3"` for 3s).
     * - `<seconds> hover-pause` — pause on pointer hover/focus
     *   (e.g. `"3 hover-pause"`).
     * - `true` / `false` (boolean form in JSX) — use `init({ autoplay })`
     *   defaults; `false` disables autoplay even if a default is set.
     *
     * Defaults from `init({ autoplay })`: `{ interval: 4, hoverPause: false }`.
     */
    'aa-autoplay'?: string | boolean | number
    /** Breakpoint variant of `aa-autoplay`. Activates at `>= breakpoints.sm`. */
    'aa-autoplay-sm'?: string | number
    /** Breakpoint variant of `aa-autoplay`. Activates at `>= breakpoints.md`. */
    'aa-autoplay-md'?: string | number
    /** Breakpoint variant of `aa-autoplay`. Activates at `>= breakpoints.lg`. */
    'aa-autoplay-lg'?: string | number
    /** Breakpoint variant of `aa-autoplay`. Activates at `>= breakpoints.xl`. */
    'aa-autoplay-xl'?: string | number

    /**
     * Marker for tabs containers. Place on the wrapper holding both toggles
     * and content panels. Toggles inside this wrapper get their `data-state`
     * managed automatically. Feature: `tabs`. Pair with `aa-tabs-toggle`,
     * `aa-tabs-content`, optionally `aa-tabs-visual`, `aa-tabs-progress`,
     * `aa-tabs-status`, `aa-tabs-initial`, and `aa-autoplay` for auto-rotate.
     */
    'aa-tabs'?: string | boolean
    /** Breakpoint variant of `aa-tabs`. Activates at `>= breakpoints.sm`. Use `none` to disable tabs at this breakpoint. */
    'aa-tabs-sm'?: string
    /** Breakpoint variant of `aa-tabs`. Activates at `>= breakpoints.md`. Use `none` to disable tabs at this breakpoint. */
    'aa-tabs-md'?: string
    /** Breakpoint variant of `aa-tabs`. Activates at `>= breakpoints.lg`. Use `none` to disable tabs at this breakpoint. */
    'aa-tabs-lg'?: string
    /** Breakpoint variant of `aa-tabs`. Activates at `>= breakpoints.xl`. Use `none` to disable tabs at this breakpoint. */
    'aa-tabs-xl'?: string
    /** Marker on each tab button/toggle inside an `[aa-tabs]` wrapper. The value matches the corresponding `aa-tabs-content` to pair them. */
    'aa-tabs-toggle'?: string
    /** Marker on each tab content panel. Value matches the paired `aa-tabs-toggle`. Animations inside default to `aa-trigger="event:tab-active"`. */
    'aa-tabs-content'?: string
    /** Marker on a per-tab visual (image, illustration). Animations inside default to `aa-trigger="event:tab-active"` like content panels. */
    'aa-tabs-visual'?: string
    /** Optional outer wrapper marker; lets the feature scope its query to a section when multiple tab groups share a page. */
    'aa-tabs-wrapper'?: string | boolean
    /** Marker on a progress-bar element inside the tabs wrapper. Drives a width animation tied to the autoplay interval. */
    'aa-tabs-progress'?: string | boolean
    /** Output: the feature writes the current tab name onto this element's `textContent` for screen-reader-friendly status. */
    'aa-tabs-status'?: string
    /** Which tab is active on first render. Match the value of one of the `aa-tabs-toggle` entries. Omit to start with the first tab. */
    'aa-tabs-initial'?: string | boolean

    /**
     * Marker on the marquee viewport (apply `overflow: hidden`). Value tokens
     * are space-separated and order-independent: `right` (reverse direction),
     * `paused` (start paused), `hover-pause`, `switch` (flip direction while
     * scrolling up), `draggable`, `none` (skip init at this breakpoint).
     * Pair with `aa-duration` (cycle seconds), `aa-scrub` (layer a
     * scroll-driven horizontal sweep on top of the loop), and `aa-distance`
     * (scrub sweep magnitude as a percentage of viewport width per side).
     * Three child wrappers are required, each with a single role:
     * `[aa-marquee-scroller]` > `[aa-marquee-track]` > `[aa-marquee-list]`.
     * Feature: `marquee`. Plugins: `ScrollTrigger`, plus `Draggable` +
     * `InertiaPlugin` when `draggable` is set.
     */
    'aa-marquee'?: string | boolean
    /**
     * Marker on the scroll-driven sweep layer (direct child of `[aa-marquee]`).
     * When `aa-scrub` is set on the root, this element gets a horizontal sweep
     * tied to scroll position — composes with the infinite loop on the track
     * below it. Stays static when `aa-scrub` is absent.
     */
    'aa-marquee-scroller'?: string | boolean
    /**
     * Marker on the infinite-loop layer (child of `[aa-marquee-scroller]`).
     * The lib clones `[aa-marquee-list]` into this element until the row fills
     * the viewport, then drives the looping translate on it. Author one list
     * inside this element; the clones (`aa-marquee-clone`) appear at runtime.
     */
    'aa-marquee-track'?: string | boolean
    /**
     * Marker on the authored cluster of items (child of `[aa-marquee-track]`).
     * This is the repeating unit — items inside it carry the spacing (use
     * `margin`, not `gap`), and the lib clones the whole list to fill the
     * viewport. The lib measures `scrollWidth` here to compute the seam.
     */
    'aa-marquee-list'?: string | boolean

    /**
     * Marker for scroll-spy navigation containers. Feature: `nav`.
     * Plugins: `ScrollTrigger`, `Flip`. Pair with `aa-nav-section` markers on
     * each navigable section, `aa-nav-current-indicator` / `aa-nav-hover-indicator`
     * for the moving highlight pill, and `aa-scroll-target` on links to enable
     * smooth-scroll-to-anchor.
     */
    'aa-nav'?: string | boolean
    /** Marker on each scroll-target section. Value matches the link's `aa-scroll-target` (or `href` anchor) to pair them. */
    'aa-nav-section'?: string
    /** Marker on the element that animates between active links via Flip. */
    'aa-nav-current-indicator'?: string | boolean
    /** Marker on the optional hover indicator element. Animates between hovered links. */
    'aa-nav-hover-indicator'?: string | boolean
    /**
     * On a link or button, value is the `aa-nav-section` value (or selector)
     * to scroll to. Wires Lenis (when active) for smoothed scroll-to-anchor.
     */
    'aa-scroll-target'?: string

    /**
     * Marker for slider containers. Value carries optional flags:
     * `draggable` | `center` | `snap` | `loop` (space-separated).
     * Feature: `slider`. Plugins: `Draggable`, `InertiaPlugin`. Pair with
     * `aa-slider-item` on each slide, optional `aa-slider-prev` / `aa-slider-next`
     * buttons, and `aa-autoplay` for auto-advance.
     */
    'aa-slider'?: string | boolean
    /** Marker on each slide. Animations inside default to `aa-trigger="event:slide-active"`. */
    'aa-slider-item'?: string | boolean
    /** Marker on the previous-slide button. Click handler is wired automatically. */
    'aa-slider-prev'?: string | boolean
    /** Marker on the next-slide button. Click handler is wired automatically. */
    'aa-slider-next'?: string | boolean
    /** Marker on dot/index navigation buttons. Value identifies which slide they jump to. */
    'aa-slider-button'?: string

    /**
     * Marker on a modal element. The attribute value is the modal's name —
     * `aa-modal-name="signup"`. Triggers (`aa-modal-target`, `aa-modal-close`)
     * reference this name. Feature: `modal`. No GSAP plugin required.
     */
    'aa-modal-name'?: string
    /** On a button/link, the `aa-modal-name` of the modal to open. */
    'aa-modal-target'?: string
    /** Marker on a close button. Closes the nearest enclosing modal (or the named one if value is given). */
    'aa-modal-close'?: string | boolean
    /** Marker on the modal backdrop element. Click on the backdrop closes the modal. */
    'aa-modal-backdrop'?: string | boolean

    /**
     * Hover animation preset. Values:
     *
     * - `bg-block` (`hover-bg-block`) — direction-aware background slide
     *   (the bg block slides in from the side the cursor entered from).
     *
     * Pair with `aa-color` to colorize the element on hover. Feature: `hover`.
     * No GSAP plugin required.
     */
    'aa-hover'?: string
    /** Breakpoint variant of `aa-hover`. Activates at `>= breakpoints.sm`. */
    'aa-hover-sm'?: string
    /** Breakpoint variant of `aa-hover`. Activates at `>= breakpoints.md`. */
    'aa-hover-md'?: string
    /** Breakpoint variant of `aa-hover`. Activates at `>= breakpoints.lg`. */
    'aa-hover-lg'?: string
    /** Breakpoint variant of `aa-hover`. Activates at `>= breakpoints.xl`. */
    'aa-hover-xl'?: string
    /**
     * Color to fade the element to on hover. Any CSS color (`#ff0033`,
     * `rgb(...)`, named color). Used on its own or with `aa-hover` for combined
     * direction-aware bg + colorize.
     */
    'aa-color'?: string
    /** Breakpoint variant of `aa-color`. Activates at `>= breakpoints.sm`. */
    'aa-color-sm'?: string
    /** Breakpoint variant of `aa-color`. Activates at `>= breakpoints.md`. */
    'aa-color-md'?: string
    /** Breakpoint variant of `aa-color`. Activates at `>= breakpoints.lg`. */
    'aa-color-lg'?: string
    /** Breakpoint variant of `aa-color`. Activates at `>= breakpoints.xl`. */
    'aa-color-xl'?: string

    /**
     * Custom cursor style. Place on a single element near `<body>` (typically
     * a `position: fixed` div). Values are space-separated style flags read by
     * the cursor module (e.g. `"follow"`, `"dot"`). Feature: `cursor`. No GSAP
     * plugin required. Use `aa-cursor-trigger` on hover targets to toggle
     * states, and `aa-cursor-*` (any suffix) for arbitrary CSS-driven variants.
     */
    'aa-cursor'?: string | boolean
    /**
     * Marker on hover targets that should change the cursor's style. The value
     * names a state the cursor module reads from `aa-cursor-<state>` styles.
     */
    'aa-cursor-trigger'?: string | boolean
    /**
     * Offset of the cursor element relative to the mouse, in percent of the
     * cursor element's own width/height. Two space-separated numbers: `"x y"`.
     * Place on the `[aa-cursor]` element. Default `"6 -140"` — cursor sits
     * slightly to the right of the mouse and 140% above it (bottom edge at
     * mouse). Examples: `"-50 -50"` (centered on mouse), `"0 0"` (top-left
     * corner at mouse), `"-100 -100"` (bottom-right corner at mouse).
     * Near the right/bottom viewport edge the cursor flips to fixed safe
     * offsets so it never clips off-screen.
     */
    'aa-cursor-offset'?: string
    /**
     * Catch-all for custom cursor state attributes. The cursor module reads
     * the suffix and toggles it on the cursor element when triggered.
     * Examples: `aa-cursor-link`, `aa-cursor-drag`, `aa-cursor-text`.
     */
    [key: `aa-cursor-${string}`]: string | boolean | undefined

    /**
     * IntersectionObserver-driven play/pause for any CSS animations on direct
     * children. Add to a marquee track or any always-running animation
     * container so off-screen elements don't waste CPU. No value needed —
     * presence is the marker. Requires `init({ scrollState: true })`
     * (the default).
     */
    'aa-toggle-playstate'?: string | boolean
  }

  interface IntrinsicAttributes extends AlrdyAnimateAttributes {}

  interface HTMLAttributes<T> extends AlrdyAnimateAttributes {}
}

export {}
