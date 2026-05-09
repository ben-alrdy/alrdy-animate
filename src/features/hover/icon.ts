import type { GsapHandle, GsapTimeline } from '../../core/gsap-detect'

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
