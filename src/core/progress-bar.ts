/**
 * Shared progress-indicator setup for autoplay-driven features (slider, tabs).
 *
 * The marked element can be one of:
 *   - a bar (default): the element's `width` (or `height`) tweens 0% → 100%
 *   - a circular sweep: the element is or contains an SVG `<circle>`; we
 *     tween its `stroke-dashoffset` from circumference → 0
 *
 * Both modes pre-set the element to its empty state at setup. The caller
 * drives play / pause / reset via the returned tween-value helpers.
 */

export type ProgressKind = 'width' | 'height' | 'circle'

export interface ProgressEntry {
  /** Element actually being tweened — the inner <circle> for circle mode. */
  target: Element
  kind: ProgressKind
  /** For 'width' / 'height': the CSS property to tween. */
  property?: 'width' | 'height'
  /** For 'circle': pre-computed 2πr so we know where to start dashoffset. */
  circumference?: number
  /** Per-element ease override (from `aa-ease` on the element) or feature default. */
  ease: string
}

/** Just the `gsap.set` signature — pass `gsap.set` (bound or not) directly. */
type GsapSet = (target: unknown, vars: Record<string, unknown>) => unknown

/**
 * Build a single ProgressEntry from a marked element, or `null` if the
 * element opts into circle mode but lacks an SVG `<circle>` (we warn and
 * skip rather than throwing — the rest of the autoplay still works).
 */
export function createProgressEntry(
  el: Element,
  attrName: string,
  fallbackEase: string,
  set: GsapSet,
): ProgressEntry | null {
  const raw = el.getAttribute(attrName)?.toLowerCase() ?? 'width'
  const ease = el.getAttribute('aa-ease') ?? fallbackEase

  if (raw === 'circle') {
    const circle =
      el.tagName.toLowerCase() === 'circle'
        ? (el as unknown as SVGCircleElement)
        : (el.querySelector('circle') as SVGCircleElement | null)
    if (!circle) {
      console.warn(
        `[alrdy-animate] ${attrName}="circle" requires an SVG <circle> on or inside the marked element.`,
        el,
      )
      return null
    }
    const r =
      typeof circle.r?.baseVal?.value === 'number'
        ? circle.r.baseVal.value
        : parseFloat(circle.getAttribute('r') ?? '0')
    const circumference = 2 * Math.PI * r
    set(circle, { strokeDasharray: circumference, strokeDashoffset: circumference })
    return { target: circle, kind: 'circle', circumference, ease }
  }

  const property: 'width' | 'height' = raw === 'height' ? 'height' : 'width'
  set(el, { [property]: '0%' })
  return { target: el, kind: property, property, ease }
}

export function progressFromValues(entry: ProgressEntry): Record<string, unknown> {
  if (entry.kind === 'circle') return { strokeDashoffset: entry.circumference }
  return { [entry.property as string]: '0%' }
}

export function progressToValues(entry: ProgressEntry): Record<string, unknown> {
  if (entry.kind === 'circle') return { strokeDashoffset: 0 }
  return { [entry.property as string]: '100%' }
}

/**
 * Set a progress indicator to a fractional fill (0..1). Used by scroll-driven
 * progress where the value is interpolated from scroll position, not animated.
 * The width/height fill uses an inline-style update for parity with the
 * autoplay path; circle uses a strokeDashoffset write so it composes with the
 * stroke-dasharray already set at `createProgressEntry` time.
 */
export function progressSetFill(
  entry: ProgressEntry,
  fraction: number,
  set: GsapSet,
): void {
  const clamped = Math.max(0, Math.min(1, fraction))
  if (entry.kind === 'circle') {
    set(entry.target, {
      strokeDashoffset: (entry.circumference ?? 0) * (1 - clamped),
    })
    return
  }
  set(entry.target, { [entry.property as string]: `${clamped * 100}%` })
}

/** The slice of GSAP a progress group drives. The autoplay controllers already
 *  hold a loosely-typed gsap, so this is structurally satisfied by that. */
interface ProgressGsap {
  set: GsapSet
  fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => unknown
  killTweensOf: (target: unknown) => void
  getTweensOf: (target: unknown) => Array<{ pause: () => void; resume: () => void }>
}

export interface ProgressGroup {
  /** Tween the active index's bar empty → full over `durationFor(index)` and
   *  snap every other bar back to empty. */
  play: (activeIndex: number, durationFor: (index: number) => number) => void
  /** Kill all in-flight tweens and reset every bar to empty. */
  reset: () => void
  /** Pause in-flight bar tweens (hover-pause). */
  pause: () => void
  /** Resume paused bar tweens. */
  resume: () => void
}

/**
 * Drive a set of progress bars (one per slide/tab) as a group. Centralises the
 * `killTweensOf` / `fromTo` / `getTweensOf` plumbing the slider and tabs
 * autoplay controllers both need — the only difference between them (per-entry
 * dwell vs a shared interval) is supplied via the `durationFor` callback.
 * `null` entries (a slide/tab with no progress element) are skipped.
 */
export function createProgressGroup(
  // The autoplay controllers hold a loosely-typed gsap (`Record<string, any>`);
  // narrow it to the slice we use here.
  gsapLoose: Record<string, unknown>,
  entries: ReadonlyArray<ProgressEntry | null>,
): ProgressGroup {
  const gsap = gsapLoose as unknown as ProgressGsap
  return {
    play(activeIndex, durationFor): void {
      entries.forEach((entry, i) => {
        if (!entry) return
        gsap.killTweensOf(entry.target)
        if (i === activeIndex) {
          gsap.fromTo(entry.target, progressFromValues(entry), {
            ...progressToValues(entry),
            duration: durationFor(i),
            ease: entry.ease,
            overwrite: true,
          })
        } else {
          gsap.set(entry.target, progressFromValues(entry))
        }
      })
    },
    reset(): void {
      for (const entry of entries) {
        if (!entry) continue
        gsap.killTweensOf(entry.target)
        gsap.set(entry.target, progressFromValues(entry))
      }
    },
    pause(): void {
      for (const entry of entries) {
        if (!entry) continue
        for (const t of gsap.getTweensOf(entry.target)) t.pause()
      }
    },
    resume(): void {
      for (const entry of entries) {
        if (!entry) continue
        for (const t of gsap.getTweensOf(entry.target)) t.resume()
      }
    },
  }
}
