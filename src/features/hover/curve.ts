import type { GsapHandle, GsapTween } from '../../core/gsap-detect'
import { defaultEdge, detectEdge, type DirectionMode, type Edge } from './direction'
import { prepareHost, restoreHost } from './host'

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
const FROM_PATHS: Record<Edge, { start: string; end: string }> = {
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
  path.setAttribute('d', FROM_PATHS[defaultEdge(settings.mode)].start)
  svg.appendChild(path)
  // First-child insertion (see block.ts comment) — keeps content on top by
  // DOM order even when broad sibling rules match the injected element.
  host.insertBefore(svg, host.firstChild)

  let active: GsapTween | null = null

  const onEnter = (event: MouseEvent): void => {
    const edge = detectEdge(event, host, settings.mode)
    const p = FROM_PATHS[edge]
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
