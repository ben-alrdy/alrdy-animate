import type { GsapHandle, GsapTimeline, GsapTween } from '../../core/gsap-detect'
import type { StaggerValue } from '../../core/stagger'
import { applySplit, type SplitMode } from '../../split/runtime'
import { defaultEdge, detectEdge, type DirectionMode, type Edge } from './direction'
import { ensurePositioned, prepareHost, restoreHost } from './host'

// ===========================================================================
// Block effect — solid panel sliding in from the entering edge
// ===========================================================================

const BLOCK_TRANSFORM: Record<Edge, { x: number; y: number }> = {
  top: { x: 0, y: -100 },
  bottom: { x: 0, y: 100 },
  left: { x: -100, y: 0 },
  right: { x: 100, y: 0 },
}

export interface BlockSettings {
  duration: number
  delay: number
  ease: string
  color: string
  mode: DirectionMode
}

export function setupBlockHover(
  host: HTMLElement,
  trigger: HTMLElement,
  gsap: GsapHandle,
  settings: BlockSettings,
): () => void {
  const restore = prepareHost(host)

  const bg = document.createElement('span')
  bg.setAttribute('aa-hover-bg', 'block')
  bg.setAttribute('aria-hidden', 'true')
  // Layout (position/inset/z-index/etc.) comes from the companion CSS rule
  // on `[aa-hover-bg]`. Only the runtime-driven fill is set inline.
  bg.style.background = settings.color
  // Append rather than insert-first — `z-index: -1` (set by the CSS rule)
  // combined with the host's `isolation: isolate` (set by prepareHost)
  // puts the bg behind the host's other content regardless of DOM order,
  // so we don't need the first-child trick anymore. Absolutely-positioned
  // children don't consume grid/flex slots, so layout stays unaffected.
  host.appendChild(bg)

  const start = BLOCK_TRANSFORM[defaultEdge(settings.mode)]
  gsap.gsap.set(bg, { xPercent: start.x, yPercent: start.y })

  let active: GsapTween | null = null

  // Edge detection runs against the trigger's rect, not the host's: when
  // trigger !== host (composite buttons), the mouseenter fires from somewhere
  // on the wrapper that may sit entirely outside the host's box — measuring
  // against the host would produce negative-axis nonsense and pick the wrong
  // edge. The block/curve still paints on the host; only the "from" edge is
  // resolved relative to the composite hit region the author intends.
  const onEnter = (event: MouseEvent): void => {
    const t = BLOCK_TRANSFORM[detectEdge(event, trigger, settings.mode)]
    active?.kill()
    active = gsap.gsap.fromTo(
      bg,
      { xPercent: t.x, yPercent: t.y },
      {
        xPercent: 0,
        yPercent: 0,
        duration: settings.duration,
        ease: settings.ease,
        delay: settings.delay,
        overwrite: true,
      },
    )
  }

  const onLeave = (event: MouseEvent): void => {
    const t = BLOCK_TRANSFORM[detectEdge(event, trigger, settings.mode)]
    active?.kill()
    active = gsap.gsap.to(bg, {
      xPercent: t.x,
      yPercent: t.y,
      duration: settings.duration,
      ease: settings.ease,
      overwrite: true,
    })
  }

  trigger.addEventListener('mouseenter', onEnter)
  trigger.addEventListener('mouseleave', onLeave)

  return () => {
    trigger.removeEventListener('mouseenter', onEnter)
    trigger.removeEventListener('mouseleave', onLeave)
    active?.kill()
    bg.remove()
    restoreHost(host, restore)
  }
}

// ===========================================================================
// Curve effect — SVG path with a sinusoidal scoop entering from an edge
// ===========================================================================

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Per-edge entry paths. Both `start` (degenerate, pinned to the entry edge,
 * zero-area) and `end` (covered, with a slight curve overshoot past the
 * opposite edge — clipped by the host's overflow:hidden, but it gives the
 * settle a bit of organic give) share the same `M L Q L L z` structure so
 * AttrPlugin's token-by-token interpolation works for the same-edge enter
 * tween. Cross-axis is never an issue here because `onEnter` uses fromTo
 * with an explicit start state, never reading the path's current `d`.
 */
const CURVE_FROM_PATHS: Record<Edge, { start: string; end: string }> = {
  top: {
    start: 'M 0 100 L 0 0 Q 50 0 100 0 L 100 0 L 0 0 z',
    end: 'M 0 100 L 0 100 Q 50 125 100 100 L 100 0 L 0 0 z',
  },
  bottom: {
    start: 'M 0 0 L 0 100 Q 50 100 100 100 L 100 100 L 0 100 z',
    end: 'M 0 0 L 0 0 Q 50 -25 100 0 L 100 100 L 0 100 z',
  },
  left: {
    start: 'M 0 0 L 0 0 Q 0 50 0 100 L 0 100 L 0 0 z',
    end: 'M 0 0 L 100 0 Q 110 50 100 100 L 0 100 L 0 0 z',
  },
  right: {
    start: 'M 100 0 L 100 0 Q 100 50 100 100 L 100 100 L 100 0 z',
    end: 'M 100 0 L 0 0 Q -10 50 0 100 L 100 100 L 100 0 z',
  },
}

/**
 * Compute the leave-path for a given edge and progress (0 → 1).
 *
 * Single-phase: the shape's receding edge moves linearly across the host
 * from "fully covered" to "retracted to leave edge", while the curve's
 * scoop magnitude peaks sinusoidally at the midpoint and returns to zero
 * at the endpoints — so the inside arc grows and disappears alongside the
 * retract instead of being two distinct stages.
 *
 * We compute `d` from a single scalar progress, so the leave tween only
 * interpolates one number (state.p) — AttrPlugin is bypassed entirely. That
 * matters because AttrPlugin's token-by-token interpolation garbles when
 * many of the path's twelve numbers change at once, which is what happens on
 * a cross-axis leave (enter from top, leave toward right) if you naively
 * tween between two whole `d` strings.
 */
function computeLeavePath(edge: Edge, progress: number): string {
  const p = Math.max(0, Math.min(1, progress))
  const scoop = 35 * Math.sin(Math.PI * p)

  if (edge === 'top') {
    const fillY = 100 * (1 - p)
    const ctrlY = fillY - scoop
    return `M 0 100 L 0 ${fillY} Q 50 ${ctrlY} 100 ${fillY} L 100 0 L 0 0 z`
  }
  if (edge === 'bottom') {
    const fillY = 100 * p
    const ctrlY = fillY + scoop
    return `M 0 100 L 0 ${fillY} Q 50 ${ctrlY} 100 ${fillY} L 100 100 L 0 100 z`
  }
  if (edge === 'left') {
    const fillX = 100 * (1 - p)
    const ctrlX = fillX - scoop
    return `M 0 0 L ${fillX} 0 Q ${ctrlX} 50 ${fillX} 100 L 0 100 L 0 0 z`
  }
  // right
  const fillX = 100 * p
  const ctrlX = fillX + scoop
  return `M 100 0 L ${fillX} 0 Q ${ctrlX} 50 ${fillX} 100 L 100 100 L 100 0 z`
}

export interface CurveSettings {
  duration: number
  delay: number
  ease: string
  color: string
  mode: DirectionMode
}

export function setupCurveHover(
  host: HTMLElement,
  trigger: HTMLElement,
  gsap: GsapHandle,
  settings: CurveSettings,
): () => void {
  const restore = prepareHost(host)

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aa-hover-bg', 'curve')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('preserveAspectRatio', 'none')
  // Layout (position/inset/width/height/z-index/etc.) comes from the
  // companion CSS rule on `[aa-hover-bg]`. Only the runtime-driven fill
  // is set inline.
  svg.style.fill = settings.color

  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', CURVE_FROM_PATHS[defaultEdge(settings.mode)].start)
  svg.appendChild(path)
  // Append (not first-child) — z-index: -1 + host's isolation: isolate
  // keep the curve behind content regardless of DOM order. See block.
  host.appendChild(svg)

  let active: GsapTween | null = null

  // See setupBlockHover — edge detection runs against the trigger's rect to
  // stay sane when trigger !== host (composite buttons).
  const onEnter = (event: MouseEvent): void => {
    const edge = detectEdge(event, trigger, settings.mode)
    const p = CURVE_FROM_PATHS[edge]
    active?.kill()
    active = gsap.gsap.fromTo(
      path,
      { attr: { d: p.start } },
      {
        attr: { d: p.end },
        duration: settings.duration,
        ease: settings.ease,
        delay: settings.delay,
        overwrite: true,
      },
    )
  }

  const onLeave = (event: MouseEvent): void => {
    const edge = detectEdge(event, trigger, settings.mode)
    active?.kill()
    const state = { p: 0 }
    active = gsap.gsap.to(state, {
      p: 1,
      duration: settings.duration,
      ease: settings.ease,
      onUpdate: () => {
        path.setAttribute('d', computeLeavePath(edge, state.p))
      },
      overwrite: true,
    })
  }

  trigger.addEventListener('mouseenter', onEnter)
  trigger.addEventListener('mouseleave', onLeave)

  return () => {
    trigger.removeEventListener('mouseenter', onEnter)
    trigger.removeEventListener('mouseleave', onLeave)
    active?.kill()
    svg.remove()
    restoreHost(host, restore)
  }
}

// ===========================================================================
// Icon effect — SVG icon clone(s) sliding through a clipped wrapper
// ===========================================================================

export type IconDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-right'
  | 'up-left'
  | 'down-right'
  | 'down-left'

export const ICON_DIRECTIONS: ReadonlySet<string> = new Set<IconDirection>([
  'up',
  'down',
  'left',
  'right',
  'up-right',
  'up-left',
  'down-right',
  'down-left',
])

interface IconAxis {
  cloneOffset: { left: string; top: string }
  motion: { xPercent?: number; yPercent?: number }
}

const ICON_MAP: Record<IconDirection, IconAxis> = {
  right: { cloneOffset: { left: '-100%', top: '0' }, motion: { xPercent: 100 } },
  left: { cloneOffset: { left: '100%', top: '0' }, motion: { xPercent: -100 } },
  up: { cloneOffset: { left: '0', top: '100%' }, motion: { yPercent: -100 } },
  down: { cloneOffset: { left: '0', top: '-100%' }, motion: { yPercent: 100 } },
  'up-right': {
    cloneOffset: { left: '-100%', top: '100%' },
    motion: { xPercent: 100, yPercent: -100 },
  },
  'down-right': {
    cloneOffset: { left: '-100%', top: '-100%' },
    motion: { xPercent: 100, yPercent: 100 },
  },
  'up-left': {
    cloneOffset: { left: '100%', top: '100%' },
    motion: { xPercent: -100, yPercent: -100 },
  },
  'down-left': {
    cloneOffset: { left: '100%', top: '-100%' },
    motion: { xPercent: -100, yPercent: 100 },
  },
}

export interface IconSettings {
  direction: IconDirection
  reverse: boolean
  /**
   * `triple` doubles the slide distance and inserts a second clone two
   * "from" steps offscreen. The first clone passes through centre at the
   * midpoint (visible briefly), the second clone lands at centre at the end.
   */
  triple: boolean
  duration: number
  delay: number
  ease: string
  /** Lag (in seconds) between each successive icon starting its slide. */
  cloneLag: number
  /**
   * Color override for the clone(s). Default `currentColor` = no override
   * (clone inherits the host's color, matching the original). Any other
   * value is set inline as the clone's `color`, which feeds the cloned
   * SVG's `stroke="currentColor"` paths — giving the "swap-in" icon a
   * distinct colour against a coloured hover background (e.g. white clone
   * over a black `curve` fill in a composite button).
   */
  color: string
}

/**
 * Scale a percentage offset (e.g. `-100%`, `0`) by an integer multiplier so
 * the second clone sits two units along the "from" axis instead of one.
 */
function scaleOffset(value: string, multiplier: number): string {
  if (value === '0' || value === '0%') return value
  const match = value.match(/^(-?[\d.]+)(%?)$/)
  if (!match) return value
  return `${parseFloat(match[1]) * multiplier}${match[2]}`
}

function scaleMotion(
  motion: IconAxis['motion'],
  multiplier: number,
): IconAxis['motion'] {
  const out: IconAxis['motion'] = {}
  if (motion.xPercent !== undefined) out.xPercent = motion.xPercent * multiplier
  if (motion.yPercent !== undefined) out.yPercent = motion.yPercent * multiplier
  return out
}

export function setupIconHover(
  host: HTMLElement,
  trigger: HTMLElement,
  gsap: GsapHandle,
  settings: IconSettings,
): () => void {
  const icon = host.querySelector('svg')
  if (!icon) return () => {}

  const map = ICON_MAP[settings.direction]
  const parent = icon.parentNode
  if (!parent) return () => {}

  // Wrap the original SVG so the clip box is exactly the icon's size — both
  // the original and the absolutely-positioned clones resolve their offsets
  // (left: -100% / top: 100% / etc.) against this wrapper, not the host.
  const wrap = document.createElement('span')
  wrap.setAttribute('aa-hover-icon-clip', '')
  Object.assign(wrap.style, {
    display: 'inline-flex',
    position: 'relative',
    overflow: 'hidden',
    verticalAlign: 'middle',
  })
  parent.insertBefore(wrap, icon)
  wrap.appendChild(icon)

  // Standard mode = 1 clone, triple mode = 2 clones. Each clone N sits at
  // N "from"-direction units offscreen; the motion delta is scaled to
  // (cloneCount) units so the trailing clone always lands exactly at centre.
  const cloneCount = settings.triple ? 2 : 1
  const motion = scaleMotion(map.motion, cloneCount)

  const clones: SVGElement[] = []
  for (let i = 1; i <= cloneCount; i++) {
    const clone = icon.cloneNode(true) as SVGElement
    clone.setAttribute('aria-hidden', 'true')
    Object.assign(clone.style, {
      position: 'absolute',
      left: scaleOffset(map.cloneOffset.left, i),
      top: scaleOffset(map.cloneOffset.top, i),
    })
    if (settings.color !== 'currentColor') clone.style.color = settings.color
    wrap.appendChild(clone)
    clones.push(clone)
  }

  const tl: GsapTimeline = gsap.gsap.timeline({
    paused: true,
    defaults: { duration: settings.duration, ease: settings.ease, delay: settings.delay },
  })
  tl.to(icon, motion, 0)
  for (let i = 0; i < clones.length; i++) {
    tl.to(clones[i], motion, settings.cloneLag * (i + 1))
  }

  const onEnter = (): void => {
    tl.timeScale(1).play(0)
  }
  const onLeave = (): void => {
    // 1.5× faster on reverse. `tl.reverse()` plays the timeline mirrored,
    // which means the trailing clone's `cloneLag` becomes a LEAD lag on
    // exit — the original is the last thing to return. Without a speed-up
    // it reads as "the icon is late." Speeding the reverse keeps the
    // forward chain effect intact while bringing the icon back into sync
    // with the other effects' flat-duration leaves (block/text).
    tl.timeScale(1.5).reverse()
  }

  trigger.addEventListener('mouseenter', onEnter)
  if (settings.reverse) trigger.addEventListener('mouseleave', onLeave)

  return () => {
    trigger.removeEventListener('mouseenter', onEnter)
    if (settings.reverse) trigger.removeEventListener('mouseleave', onLeave)
    tl.kill()
    for (const clone of clones) clone.remove()
    // Unwrap: drop the icon back to its original parent and remove the wrapper.
    parent.insertBefore(icon, wrap)
    wrap.remove()
    gsap.gsap.set(icon, { clearProps: 'transform' })
  }
}

// ===========================================================================
// Underline effect — animated underline bar(s) at the host's bottom edge
// ===========================================================================

export interface UnderlineSettings {
  duration: number
  delay: number
  ease: string
  color: string
  /** `underline` → bar is always visible; on hover it collapses to the right
   *  edge then re-grows from the left in a two-phase sweep. `underline-in` →
   *  bar is off by default, sweeps in on hover and out on leave. */
  variant: 'underline' | 'underline-in'
}

function createUnderlineBar(color: string): HTMLSpanElement {
  const bar = document.createElement('span')
  bar.setAttribute('aa-hover-underline', '')
  bar.setAttribute('aria-hidden', 'true')
  // Companion CSS supplies layout (position, width, height, default offset,
  // currentColor background, transform-origin). Inline backgroundColor only
  // when the author overrode aa-color away from currentColor.
  if (color !== 'currentColor') bar.style.backgroundColor = color
  return bar
}

/**
 * `underline` — bar always visible. Hover plays a single sweep-out / sweep-in
 * cycle (collapse to the right edge, then re-grow from the left). Mouseleave
 * is a no-op because the cycle already lands back in the always-on state.
 * A second mouseenter mid-cycle is ignored so the bar never re-enters
 * partway through itself — two bars tiling each other's gap would render
 * a simultaneous cross-fade visually static, hence the sequenced sweep.
 */
function setupUnderlineSweep(
  host: HTMLElement,
  trigger: HTMLElement,
  gsap: GsapHandle,
  settings: UnderlineSettings,
): () => void {
  const restore = ensurePositioned(host)
  const bar = createUnderlineBar(settings.color)
  host.appendChild(bar)
  gsap.gsap.set(bar, { scaleX: 1, transformOrigin: 'left center' })

  let active: GsapTimeline | null = null
  const half = settings.duration / 2

  const onEnter = (): void => {
    if (active) return
    active = gsap.gsap
      .timeline({ delay: settings.delay, onComplete: () => (active = null) })
      .set(bar, { transformOrigin: 'right center' })
      .to(bar, { scaleX: 0, duration: half, ease: settings.ease })
      .set(bar, { transformOrigin: 'left center' })
      .to(bar, { scaleX: 1, duration: half, ease: settings.ease })
  }

  trigger.addEventListener('mouseenter', onEnter)

  return () => {
    trigger.removeEventListener('mouseenter', onEnter)
    active?.kill()
    bar.remove()
    restoreHost(host, restore)
  }
}

/**
 * `underline-in` — bar invisible at rest. Mouseenter grows it from the left,
 * mouseleave shrinks it toward the right. Quick re-entry mid-OUT accelerates
 * the in-flight tween to land within ~FINISH_SECONDS, then chains the IN tween
 * — so direction stays correct (OUT rightward, IN leftward) with no snap.
 * Quick re-leave mid-IN is queued: the full IN runs first, then OUT.
 */
function setupUnderlineIn(
  host: HTMLElement,
  trigger: HTMLElement,
  gsap: GsapHandle,
  settings: UnderlineSettings,
): () => void {
  const FINISH_SECONDS = 0.1

  const restore = ensurePositioned(host)
  const bar = createUnderlineBar(settings.color)
  host.appendChild(bar)
  gsap.gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' })

  let inActive: GsapTween | null = null
  let outActive: GsapTween | null = null
  let pendingLeave = false
  let pendingEnter = false

  const runIn = (): void => {
    inActive = gsap.gsap.fromTo(
      bar,
      { scaleX: 0, transformOrigin: 'left center' },
      {
        scaleX: 1,
        duration: settings.duration,
        ease: settings.ease,
        delay: settings.delay,
        onComplete: () => {
          inActive = null
          if (pendingLeave) {
            pendingLeave = false
            runOut()
          }
        },
      },
    )
  }

  const runOut = (): void => {
    outActive = gsap.gsap.fromTo(
      bar,
      { transformOrigin: 'right center' },
      {
        scaleX: 0,
        duration: settings.duration,
        ease: settings.ease,
        onComplete: () => {
          outActive = null
          if (pendingEnter) {
            pendingEnter = false
            runIn()
          }
        },
      },
    )
  }

  const onEnter = (): void => {
    if (inActive) {
      // User flicked back over while IN is still growing — cancel the queued
      // OUT so the bar doesn't immediately retract when IN completes.
      pendingLeave = false
      return
    }
    if (outActive) {
      // Accelerate the in-flight OUT to land within FINISH_SECONDS wall-clock,
      // then let its onComplete chain into runIn. Preserves directional
      // integrity (OUT shrinks rightward; IN grows from left) without a snap.
      pendingEnter = true
      pendingLeave = false
      const remainingAt1x = settings.duration * (1 - outActive.progress())
      outActive.timeScale(Math.max(1, remainingAt1x / FINISH_SECONDS))
      return
    }
    pendingLeave = false
    runIn()
  }

  const onLeave = (): void => {
    if (inActive) {
      pendingLeave = true
      return
    }
    if (outActive) {
      // User pulled out mid-accelerated-finish. Cancel the queued IN and
      // restore 1× playback so the bar shrinks at its natural pace.
      pendingEnter = false
      outActive.timeScale(1)
      return
    }
    runOut()
  }

  trigger.addEventListener('mouseenter', onEnter)
  trigger.addEventListener('mouseleave', onLeave)

  return () => {
    trigger.removeEventListener('mouseenter', onEnter)
    trigger.removeEventListener('mouseleave', onLeave)
    inActive?.kill()
    outActive?.kill()
    bar.remove()
    restoreHost(host, restore)
  }
}

export function setupUnderlineHover(
  host: HTMLElement,
  trigger: HTMLElement,
  gsap: GsapHandle,
  settings: UnderlineSettings,
): () => void {
  return settings.variant === 'underline'
    ? setupUnderlineSweep(host, trigger, gsap, settings)
    : setupUnderlineIn(host, trigger, gsap, settings)
}

// ===========================================================================
// Text effect — chars/words translate up; text-shadow at original baseline
// renders the "incoming" letter underneath. No DOM clones; pure shadow trick.
// ===========================================================================

export interface TextSettings {
  duration: number
  delay: number
  ease: string
  color: string
  splitMode: SplitMode
  stagger: StaggerValue
  /** false (default) = one-shot: tween up, then instantly snap back to rest.
   * The animation always plays to completion; re-hovers mid-tween are ignored.
   * true = transition: chars stay up while hovered, return on leave, and either
   * direction can be interrupted mid-tween (CSS-transition-like behaviour). */
  reverse: boolean
}

/**
 * Force the host into the layout invariant the shadow trick requires:
 * `line-height: 1`, zero vertical padding, and a clip-path reference box.
 * `display: inline` is upgraded to `inline-block` because clip-path on a
 * raw inline element resolves percentages against a degenerate box and
 * clips the chars to nothing (visible when the host sits inside another
 * inline element). `block` / `inline-block` / `flex` etc. are left alone.
 * With these guarantees the element box equals the font's em-box and the
 * text-shadow trick lands cleanly. Authors who need vertical breathing
 * room should wrap the host or use margin — padding on the host itself
 * is what causes the shadow to leak.
 */
interface TextHostRestore {
  lineHeight: string
  paddingTop: string
  paddingBottom: string
  clipPath: string
  display: string
}

function prepareTextHost(host: HTMLElement): TextHostRestore {
  const restore: TextHostRestore = {
    lineHeight: host.style.lineHeight,
    paddingTop: host.style.paddingTop,
    paddingBottom: host.style.paddingBottom,
    clipPath: host.style.clipPath,
    display: host.style.display,
  }
  host.style.lineHeight = '1'
  host.style.paddingTop = '0'
  host.style.paddingBottom = '0'
  if (getComputedStyle(host).display === 'inline') host.style.display = 'inline-block'
  return restore
}

function restoreTextHost(host: HTMLElement, restore: TextHostRestore): void {
  host.style.lineHeight = restore.lineHeight
  host.style.paddingTop = restore.paddingTop
  host.style.paddingBottom = restore.paddingBottom
  host.style.clipPath = restore.clipPath
  host.style.display = restore.display
}

export function setupTextHover(
  host: HTMLElement,
  trigger: HTMLElement,
  gsap: GsapHandle,
  settings: TextSettings,
): () => void {
  const restoreState = prepareTextHost(host)

  // Matches Osmo's button-032 defaults — battle-tested in production. The 0%
  // top means ascenders at rest may clip slightly at the box top (accepted
  // trade-off). The -15% bottom extends the visible region 15% below the box
  // so descenders (g, p, q, y) render unclipped; combined with a 1.1em shift
  // this leaves a sliver (~0.05em) where the shadow's top ascenders are
  // technically visible, which is hidden in practice by the actual glyph
  // ascent of typical fonts. Override per-host via `--aa-hover-text-clip`.
  const clipOverride = getComputedStyle(host).getPropertyValue('--aa-hover-text-clip').trim()
  host.style.clipPath = clipOverride || 'inset(0% 0% -15%)'

  // Shift = how far chars translate AND how far the text-shadow sits below
  // the original baseline. 1.1em (Osmo default) — chars at y=-1.1em are
  // entirely above the box (char top at -1.1em, char bottom at -0.1em),
  // making the one-shot's snap-back invisible. Override per-host via
  // `--aa-hover-text-shift`. Use a length ≥ box height (1em).
  const shift =
    getComputedStyle(host).getPropertyValue('--aa-hover-text-shift').trim() || '1.1em'

  let units: HTMLElement[] = []
  let tl: GsapTimeline | null = null

  const applyShadows = (els: HTMLElement[]): void => {
    for (const u of els) u.style.textShadow = `0 ${shift} ${settings.color}`
  }
  const clearShadows = (els: HTMLElement[]): void => {
    for (const u of els) u.style.textShadow = ''
  }

  const pickUnits = (split: {
    words: HTMLElement[]
    chars: HTMLElement[]
    lines: HTMLElement[]
  }): HTMLElement[] => {
    if (settings.splitMode === 'words') return split.words
    // `lines` mode + the companion CSS `white-space: nowrap` on hover-text
    // hosts collapses the text to a single line — so SplitText('lines')
    // produces one line wrapper, and tweening that wrapper lifts the whole
    // text as a single block (no per-char/word stagger). The host itself
    // stays put, so the text-shadow trick still reveals at the rest position.
    if (settings.splitMode === 'lines') return split.lines
    return split.chars
  }

  /**
   * Build a paused timeline that lifts the chars to `y: -shift` with stagger.
   * Reverse mode plays forward on enter / reverse on leave (resumes from
   * current time, so fast flicks interrupt cleanly). One-shot mode plays
   * forward then snaps back to y=0 via onComplete — the snap is invisible
   * because chars at y=-shift sit above the clip-path's top edge.
   *
   * Using a timeline (rather than fresh `gsap.to` tweens per enter/leave)
   * keeps the stagger naturally mirrored on reverse — the last char to lift
   * is the first to drop, reading as a wave that goes up then back down
   * instead of two same-direction waves.
   */
  const buildTimeline = (): void => {
    tl?.kill()
    tl = gsap.gsap.timeline({ paused: true })
    tl.fromTo(
      units,
      { y: 0 },
      {
        y: `-${shift}`,
        duration: settings.duration,
        ease: settings.ease,
        delay: settings.delay,
        stagger: settings.stagger,
      },
    )
    if (!settings.reverse) {
      tl.eventCallback('onComplete', () => {
        gsap.gsap.set(units, { y: 0 })
      })
    }
  }

  const split = applySplit(host, settings.splitMode, gsap, {
    onResplit: (newSplit) => {
      units = pickUnits(newSplit)
      applyShadows(units)
      buildTimeline()
    },
  })
  units = pickUnits(split)
  if (units.length === 0) {
    split.revert()
    restoreTextHost(host, restoreState)
    return () => {}
  }
  applyShadows(units)
  buildTimeline()

  const onEnter = (): void => {
    if (settings.reverse) {
      // play() resumes forward from current time, so an enter mid-reverse
      // picks up wherever the chars are and tweens back up smoothly.
      // timeScale(1) resets the 1.5× speed-up applied on the previous leave.
      tl!.timeScale(1).play()
    } else {
      // One-shot: replay from the start, but ignore re-entries while the
      // animation is still in flight so the run always finishes.
      if (tl!.isActive()) return
      tl!.restart()
    }
  }

  const onLeave = (): void => {
    // Reverse mode only. 1.5× speed-up on exit matches the icon hover —
    // the entrance gets to read at its full ease, the exit gets out of the
    // way faster so quick flicks don't feel laggy. reverse() plays the
    // timeline backward from current time, interrupting a partial enter
    // cleanly.
    tl!.timeScale(1.5).reverse()
  }

  trigger.addEventListener('mouseenter', onEnter)
  if (settings.reverse) trigger.addEventListener('mouseleave', onLeave)

  return () => {
    trigger.removeEventListener('mouseenter', onEnter)
    if (settings.reverse) trigger.removeEventListener('mouseleave', onLeave)
    tl?.kill()
    clearShadows(units)
    restoreTextHost(host, restoreState)
    split.revert()
  }
}
