import type { GsapInstance } from '../../core/gsap-detect'
import { parseNum } from '../../core/parse'
import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { emitTrigger } from '../../core/trigger'

const IN_FLAGS = new Set([
  'fade',
  'scale',
  'rotate',
  'rotate-cw',
  'rotate-ccw',
  'tilt',
  'tilt-cw',
  'tilt-ccw',
])
const LOCK_FLAGS = new Set(['bounce', 'pulse'])
const OUT_FLAGS = new Set(['fade', 'scale', 'perspective', 'blur', 'left', 'right'])

type Vars = Record<string, number | string>

function parseFlags(value: string | undefined, valid: Set<string>): Set<string> {
  if (!value) return new Set()
  const out = new Set<string>()
  for (const t of value.trim().split(/\s+/)) {
    if (t && t !== 'none' && valid.has(t)) out.add(t)
  }
  return out
}

type RotationMode = 'default' | 'cw' | 'ccw'

// Per-card rotation value for the `rotate` and `tilt` flag families. Both
// families use the same per-index curve; the difference is timing — `rotate`
// applies the value as the from-state (cards arrive tilted, settle flat),
// `tilt` applies it as the to-state (cards arrive flat, build up by lock).
//
// - `default`: `(0°, -5°, +5°, -5°, +5°, …)` — balanced fan around centre,
//   first card flat. Osmo's standard splay aesthetic.
// - `cw`: incremental clockwise ramp `(0°, +1°, +2°, +3°, …)`. First card
//   flat; each subsequent card adds one more degree of clockwise rotation.
//   (CSS rotation is positive-clockwise.)
// - `ccw`: mirror of `cw` — `(0°, -1°, -2°, -3°, …)`.
function rotationForIndex(index: number, distance: number, mode: RotationMode): number {
  if (mode === 'cw') return index * distance
  if (mode === 'ccw') return -index * distance
  if (index === 0) return 0
  return (index % 2 === 1 ? -1 : 1) * 5 * distance
}

// Resolve the active mode for one of the two rotation families. Each family
// has a default flag (`rotate` / `tilt`) and two directional variants
// (`-cw` / `-ccw`). Directional variants win over the default within a family.
function modeFor(flags: Set<string>, prefix: 'rotate' | 'tilt'): RotationMode | null {
  if (flags.has(`${prefix}-cw`)) return 'cw'
  if (flags.has(`${prefix}-ccw`)) return 'ccw'
  if (flags.has(prefix)) return 'default'
  return null
}

/**
 * Per-card rotation pair for the in-tween. The `rotate*` family applies the
 * angle as the from-state (card arrives tilted, settles flat). The `tilt*`
 * family applies it as the to-state (card arrives flat, builds up by lock).
 * The two families share the same per-card curve via `rotationForIndex` —
 * only the timing differs. When both are listed `tilt*` wins.
 */
function rotationPair(
  rotateMode: RotationMode | null,
  tiltMode: RotationMode | null,
  index: number,
  distance: number,
): { from?: number; to?: number } {
  if (tiltMode !== null) {
    return { from: 0, to: rotationForIndex(index, distance, tiltMode) }
  }
  if (rotateMode !== null) {
    return { from: rotationForIndex(index, distance, rotateMode), to: 0 }
  }
  return {}
}

function buildInFrom(flags: Set<string>, distance: number, rotation: number | undefined): Vars {
  const v: Vars = {}
  if (flags.has('fade')) v.opacity = 0
  if (flags.has('scale')) v.scale = Math.max(0, 1 - 0.2 * distance)
  if (rotation !== undefined) v.rotation = rotation
  return v
}

function buildInTo(flags: Set<string>, rotation: number | undefined): Vars {
  const v: Vars = {}
  if (flags.has('fade')) v.opacity = 1
  if (flags.has('scale')) v.scale = 1
  if (rotation !== undefined) v.rotation = rotation
  return v
}

function buildOutTo(flags: Set<string>, distance: number): Vars {
  const v: Vars = {}
  // Order matters where flags share a property — later writes win, so the
  // composite flags (`perspective`, `blur`, `left`, `right`) override plain
  // `fade` / `scale` when combined.
  if (flags.has('fade')) v.opacity = 0
  if (flags.has('scale')) v.scale = Math.max(0, 1 - 0.15 * distance)
  if (flags.has('perspective')) {
    v.rotationX = 10 * distance
    v.scale = 0.92
    v.y = '-2rem'
  }
  if (flags.has('blur')) {
    v.filter = `blur(${8 * distance}px)`
    v.y = '-1rem'
  }
  if (flags.has('left')) {
    v.x = `${-4 * distance}rem`
    v.opacity = 0
  }
  if (flags.has('right')) {
    v.x = `${4 * distance}rem`
    v.opacity = 0
  }
  return v
}

function playLock(gsap: GsapInstance, card: HTMLElement, flags: Set<string>): void {
  if (flags.has('bounce')) {
    gsap
      .timeline({ overwrite: 'auto' })
      .to(card, { scaleX: 1.06, scaleY: 0.94, duration: 0.1, ease: 'power1.out' })
      .to(card, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'elastic.out(1, 0.3)' })
  } else if (flags.has('pulse')) {
    gsap
      .timeline({ overwrite: 'auto' })
      .to(card, { scale: 1.03, duration: 0.15, ease: 'power1.out' })
      .to(card, { scale: 1, duration: 0.3, ease: 'back.out(2)' })
  }
}

interface StackGeometry {
  tops: number[]
  stickyTop: number
}

/**
 * Capture each card's natural in-flow top in document coordinates, plus the
 * sticky-top offset, in a single layout pass.
 *
 * Why this exists: Chrome (and Webkit) inflate a sticky element's `offsetTop`
 * by the sticky offset while the element is currently "stuck", so neither
 * `offsetTop` nor `getBoundingClientRect().top` give us the natural in-flow
 * position once any card is locked. To measure correctly we read sticky-top
 * first (from the un-mutated computed style), then temporarily strip
 * `position: sticky`, force a synchronous layout, read each card's offsetTop
 * chain, and restore the original inline values. The strip is a single tick —
 * no paint happens between the style mutations and the synchronous read.
 *
 * Called on setup and on every ScrollTrigger refresh (resize, etc.) so the
 * cached geometry stays correct as the layout evolves.
 */
function captureGeometry(cards: HTMLElement[]): StackGeometry {
  // Read sticky-top first, *before* we strip `position: sticky`. After
  // stripping, `top` resolves to `auto` and parseFloat returns NaN.
  const stickyTop = parseFloat(getComputedStyle(cards[0]).top) || 0
  const saved: string[] = []
  for (let i = 0; i < cards.length; i++) {
    saved.push(cards[i].style.position)
    cards[i].style.position = 'static'
  }
  // Force a layout flush so `offsetTop` reflects the stripped state.
  void cards[0].offsetHeight
  const tops = cards.map((c) => {
    let top = 0
    let cur: HTMLElement | null = c
    while (cur) {
      top += cur.offsetTop
      cur = cur.offsetParent as HTMLElement | null
    }
    return top
  })
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.position = saved[i]
  }
  return { tops, stickyTop }
}

interface ScrollTriggerCtorWithEvents {
  create: (vars: Record<string, unknown>) => { kill: () => void }
  addEventListener: (event: string, fn: () => void) => void
  removeEventListener: (event: string, fn: () => void) => void
}

/**
 * Parse the second token of a ScrollTrigger position string as a viewport
 * fraction. Accepts `'top 85%'`, `'top bottom'`, `'top center'`, `'top top'`,
 * plain `'85%'`, etc. Defaults to 0.85 (i.e. the lib's default scroll-start).
 *
 * Only the second token is parsed — the first (`'top'` / `'center'` / etc.)
 * is implicitly the element's top edge for stack, since each card is anchored
 * by its top in the sticky lock model.
 */
function parseViewportFraction(value: string | undefined): number {
  if (!value) return 0.85
  const parts = value.trim().split(/\s+/)
  const second = parts.length > 1 ? parts[1] : parts[0]
  if (!second) return 0.85
  if (second === 'bottom') return 1
  if (second === 'center') return 0.5
  if (second === 'top') return 0
  const m = second.match(/^([\d.]+)%?$/)
  if (!m) return 0.85
  const n = parseFloat(m[1])
  return Number.isFinite(n) ? (n > 1 ? n / 100 : n) : 0.85
}

function setupOne(
  ctx: FeatureContext,
  root: HTMLElement,
  config: Config,
): (() => void) | undefined {
  if ((config['aa-stack'] ?? '').trim() === 'none') return undefined

  const cards = Array.from(root.querySelectorAll<HTMLElement>('[aa-stack-card]'))
  if (cards.length === 0) return undefined

  const ScrollTrigger = ctx.gsap.plugins.ScrollTrigger as ScrollTriggerCtorWithEvents | undefined
  if (!ScrollTrigger) return undefined

  const gsap = ctx.gsap.gsap

  const inFlags = parseFlags(config['aa-stack-in'], IN_FLAGS)
  const lockFlags = parseFlags(config['aa-stack-lock'], LOCK_FLAGS)
  const outFlags = parseFlags(config['aa-stack-out'], OUT_FLAGS)

  const distance = parseNum(config['aa-distance'], ctx.options.distance)
  // Scrub is hardcoded true (direct, no smoothing). The cards themselves move
  // with scroll instantly via CSS `position: sticky` — only the JS-driven
  // transforms (rotate / scale / blur) are scrubbed. Adding smoothing would
  // desync the visual transforms from the (instant) card position, producing
  // a "rotation lags behind card position" mismatch. Out of scope for stack;
  // users who need scrub smoothing should use the `scroll` feature instead.
  const scrub: true = true

  // Resolve the active rotation mode for each family once — the flag set is
  // constant per setup, so per-card lookups inside the build helpers would
  // just repeat work.
  const rotateMode = modeFor(inFlags, 'rotate')
  const tiltMode = modeFor(inFlags, 'tilt')

  // Two separate scroll positions:
  //  - `eventFraction` drives the card-active / card-inactive events that
  //    fire the inner `aa-animate` children. Honors `aa-scroll-start`
  //    (default `top 85%`) just like every other content animation.
  //  - The in / out visual tweens always scrub from `top bottom` (the card
  //    first peeking into the viewport from below) to the lock point. Not
  //    user-configurable — the visual choreography is tied to the layout.
  const eventFraction = parseViewportFraction(
    config['aa-scroll-start'] ?? ctx.options.scrollStart,
  )

  // Cached layout geometry — naturals + sticky-top offset captured in a
  // single strip-and-measure pass. Recaptured on every ScrollTrigger refresh
  // so resizes and mid-scroll inits stay correct. Function-form trigger
  // positions below read from this object, never from live offsetTop /
  // getComputedStyle, both of which inflate by the sticky offset whenever a
  // card is currently locked.
  let geometry = captureGeometry(cards)
  const onRefreshInit = (): void => {
    geometry = captureGeometry(cards)
  }
  ScrollTrigger.addEventListener('refreshInit', onRefreshInit)

  const reduceMotion = ctx.reducedMotion !== null
  const cleanups: Array<() => void> = []
  cleanups.push(() => ScrollTrigger.removeEventListener('refreshInit', onRefreshInit))
  const again = ctx.options.again !== false

  cards.forEach((card, index) => {
    // z-index ladder: later cards sit on top so each new card visibly
    // overlays the previous one as it slides up to its lock point. Without
    // this the next card would slot in *behind* the locked previous card
    // and disappear from view.
    gsap.set(card, { zIndex: index + 1 })

    // Absolute scroll positions read from the geometry cache. ScrollTrigger
    // re-evaluates these on every refresh, picking up the freshly-captured
    // values from `onRefreshInit` above.
    const entryStart = (): number => geometry.tops[index] - window.innerHeight
    const lockPoint = (): number => geometry.tops[index] - geometry.stickyTop
    const eventActiveAt = (): number =>
      geometry.tops[index] - eventFraction * window.innerHeight
    const eventResetAt = (): number =>
      geometry.tops[index] - window.innerHeight

    // Per-card state gate. Event-mode child animations (`subscribeWithPair`
    // path in setupTriggeredAnimation) call `.play(0)` on every forward
    // dispatch, which would replay every time the user scrolls back across
    // the active threshold without ever fully leaving. Matching the standard
    // scroll-feature's aa-again semantics ("replay only after full reset")
    // means we dispatch `card-active` only on the inactive→active edge and
    // `card-inactive` only on the active→inactive edge.
    let isActive = false
    const setActive = (next: boolean, name: 'card-active' | 'card-inactive'): void => {
      if (isActive === next) return
      isActive = next
      emitTrigger(card, name)
    }

    // Card-active trigger. Fires only on the leading edge — the trigger sits
    // dormant on subsequent forward crossings until card-inactive has reset
    // the gate (full leaveback past the reset threshold).
    const activeTrigger = ScrollTrigger.create({
      trigger: card,
      start: eventActiveAt,
      onEnter: () => setActive(true, 'card-active'),
    })
    cleanups.push(() => activeTrigger.kill())

    // Card-inactive trigger (full-leaveback reset) — only when `again` is
    // enabled, mirroring the lib's standard `bindAgainTrigger` semantics.
    if (again) {
      const inactiveTrigger = ScrollTrigger.create({
        trigger: card,
        start: eventResetAt,
        onLeaveBack: () => setActive(false, 'card-inactive'),
      })
      cleanups.push(() => inactiveTrigger.kill())
    }

    // Bootstrap dispatch: if the page is loaded mid-scroll past the active
    // threshold, fire card-active so already-on-screen content animates.
    // Deferred so the dispatch happens after this init loop completes and
    // child subscribers from other features are registered. Set the gate
    // synchronously so the deferred fire doesn't fail the edge check, and
    // so subsequent forward crossings (e.g. after a small scroll-up) don't
    // re-dispatch before a full inactive reset. Tracked so `destroy()` mid-
    // tick cancels the pending dispatch before it hits a torn-down DOM.
    if (window.scrollY >= eventActiveAt()) {
      isActive = true
      const bootstrap = gsap.delayedCall(0, () => emitTrigger(card, 'card-active'))
      cleanups.push(() => bootstrap.kill())
    }

    // Visual transforms are skipped under reduced motion; the event triggers
    // above still fire so children's own animations (which honour reduced
    // motion themselves) run on schedule.
    if (reduceMotion) return

    if (inFlags.size > 0) {
      const rot = rotationPair(rotateMode, tiltMode, index, distance)
      const tween = gsap.fromTo(
        card,
        buildInFrom(inFlags, distance, rot.from),
        {
          ...buildInTo(inFlags, rot.to),
          ease: 'power1.in',
          // Defer the from-state until ScrollTrigger's first refresh tick.
          // Without this, gsap.fromTo applies `rotation: ±15°` synchronously
          // during this feature's init — and the text feature, which inits
          // afterward in the same tick, then runs SplitText against a rotated
          // card. SplitText measures per-character positions to group lines;
          // on a rotated element each character sits at a different rotated
          // y-coordinate, so every word ends up on its own line. ScrollTrigger
          // refreshes after init completes, so this only postpones the visual
          // by one tick — no perceptible flash.
          immediateRender: false,
          scrollTrigger: {
            trigger: card,
            start: entryStart,
            end: lockPoint,
            scrub,
          },
        },
      )
      cleanups.push(() => tween.kill())
    }

    if (lockFlags.size > 0) {
      const trigger = ScrollTrigger.create({
        trigger: card,
        start: lockPoint,
        onEnter: () => playLock(gsap, card, lockFlags),
      })
      cleanups.push(() => trigger.kill())
    }

    // Out tween: scrubbed over the *next* card's entry window. The last card
    // has nothing to be overlaid by, so it holds its settled state.
    if (outFlags.size > 0 && index < cards.length - 1) {
      const nextCard = cards[index + 1]
      const nextEntryStart = (): number => geometry.tops[index + 1] - window.innerHeight
      const nextLockPoint = (): number => geometry.tops[index + 1] - geometry.stickyTop
      const tween = gsap.to(card, {
        ...buildOutTo(outFlags, distance),
        ease: 'power1.in',
        scrollTrigger: {
          trigger: nextCard,
          start: nextEntryStart,
          end: nextLockPoint,
          scrub,
        },
      })
      cleanups.push(() => tween.kill())
    }
  })

  return () => {
    try {
      for (const fn of cleanups) fn()
    } catch {
      // best-effort — partial teardown is acceptable since the feature is
      // also reverted by the surrounding gsap.matchMedia scope on destroy.
    }
  }
}

const stackFeature: FeatureModule = {
  name: 'stack',
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('aa-stack'),
    )
    for (const root of subjects) {
      const attrs = readAttrs(root)
      ctx.responsive.bind(root, attrs, ({ config }) => setupOne(ctx, root, config))
    }
    return () => {}
  },
}

export default stackFeature
