import type { GsapHandle, GsapTimeline, GsapTween } from '../../core/gsap-detect'
import { defaultEdge, detectEdge, type DirectionMode, type Edge } from './direction'
import { prepareHost, restoreHost } from './host'

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
  gsap: GsapHandle,
  settings: BlockSettings,
): () => void {
  const restore = prepareHost(host)

  const bg = document.createElement('span')
  bg.setAttribute('aa-hover-bg', 'block')
  bg.setAttribute('aria-hidden', 'true')
  Object.assign(bg.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    background: settings.color,
    willChange: 'transform',
  })
  // Inserted as the first child so content paints over the bg by DOM order
  // alone — without this, broad selectors like `.host span { z-index: 1 }`
  // would also match the injected span, tie on z-index, and let the bg
  // (last child) cover the content. Absolutely-positioned children don't
  // consume grid/flex slots, so layout stays unaffected.
  host.insertBefore(bg, host.firstChild)

  const start = BLOCK_TRANSFORM[defaultEdge(settings.mode)]
  gsap.gsap.set(bg, { xPercent: start.x, yPercent: start.y })

  let active: GsapTween | null = null

  const onEnter = (event: MouseEvent): void => {
    const t = BLOCK_TRANSFORM[detectEdge(event, host, settings.mode)]
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
    const t = BLOCK_TRANSFORM[detectEdge(event, host, settings.mode)]
    active?.kill()
    active = gsap.gsap.to(bg, {
      xPercent: t.x,
      yPercent: t.y,
      duration: settings.duration,
      ease: settings.ease,
      overwrite: true,
    })
  }

  host.addEventListener('mouseenter', onEnter)
  host.addEventListener('mouseleave', onLeave)

  return () => {
    host.removeEventListener('mouseenter', onEnter)
    host.removeEventListener('mouseleave', onLeave)
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
  gsap: GsapHandle,
  settings: CurveSettings,
): () => void {
  const restore = prepareHost(host)

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aa-hover-bg', 'curve')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('preserveAspectRatio', 'none')
  Object.assign(svg.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    fill: settings.color,
  })

  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', CURVE_FROM_PATHS[defaultEdge(settings.mode)].start)
  svg.appendChild(path)
  // First-child insertion (see block.ts comment) — keeps content on top by
  // DOM order even when broad sibling rules match the injected element.
  host.insertBefore(svg, host.firstChild)

  let active: GsapTween | null = null

  const onEnter = (event: MouseEvent): void => {
    const edge = detectEdge(event, host, settings.mode)
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
    const edge = detectEdge(event, host, settings.mode)
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

  host.addEventListener('mouseenter', onEnter)
  host.addEventListener('mouseleave', onLeave)

  return () => {
    host.removeEventListener('mouseenter', onEnter)
    host.removeEventListener('mouseleave', onLeave)
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
    tl.reverse()
  }

  host.addEventListener('mouseenter', onEnter)
  if (settings.reverse) host.addEventListener('mouseleave', onLeave)

  return () => {
    host.removeEventListener('mouseenter', onEnter)
    if (settings.reverse) host.removeEventListener('mouseleave', onLeave)
    tl.kill()
    for (const clone of clones) clone.remove()
    // Unwrap: drop the icon back to its original parent and remove the wrapper.
    parent.insertBefore(icon, wrap)
    wrap.remove()
    gsap.gsap.set(icon, { clearProps: 'transform' })
  }
}
