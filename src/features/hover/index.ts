import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'

const SUPPORTED = new Set(['hover-bg-block'])

function elementMatches(el: Element): boolean {
  const value = el.getAttribute('aa-animate')
  if (value) {
    for (const part of value.split('|')) {
      if (SUPPORTED.has(part.trim())) return true
    }
  }
  for (const bp of ['sm', 'md', 'lg', 'xl']) {
    const v = el.getAttribute(`aa-animate-${bp}`)
    if (v && SUPPORTED.has(v.trim())) return true
  }
  return false
}

function parseNum(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

type EdgeName = 'top' | 'bottom' | 'left' | 'right'
const DIRECTIONS: Record<EdgeName, { x: number; y: number }> = {
  top: { x: 0, y: -100 },
  bottom: { x: 0, y: 100 },
  left: { x: -100, y: 0 },
  right: { x: 100, y: 0 },
}

function getMouseEnterDirection(e: MouseEvent, el: Element): EdgeName {
  const rect = el.getBoundingClientRect()
  const edges: Record<EdgeName, number> = {
    top: Math.abs(rect.top - e.clientY),
    bottom: Math.abs(rect.bottom - e.clientY),
    left: Math.abs(rect.left - e.clientX),
    right: Math.abs(rect.right - e.clientX),
  }
  let min = Infinity
  let best: EdgeName = 'bottom'
  for (const k of Object.keys(edges) as EdgeName[]) {
    if (edges[k] < min) {
      min = edges[k]
      best = k
    }
  }
  return best
}

function setupBgBlock(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const bg = element.querySelector('[aa-hover-bg]') as HTMLElement | null
  if (!bg) {
    if (ctx.debug) {
      console.warn(
        '[alrdy-animate] hover-bg-block requires a child element with the aa-hover-bg attribute.',
        element,
      )
    }
    return undefined
  }
  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration ?? 0.5)
  const ease = config['aa-ease'] ?? opts.ease ?? 'power2.out'

  const initial = DIRECTIONS.bottom
  ctx.gsap.gsap.set(bg, { xPercent: initial.x, yPercent: initial.y, autoAlpha: 1 })

  let active: { kill(): void } | null = null

  const onEnter = (e: Event): void => {
    const dir = getMouseEnterDirection(e as MouseEvent, element)
    const t = DIRECTIONS[dir]
    if (active) active.kill()
    active = ctx.gsap.gsap.fromTo(
      bg,
      { xPercent: t.x, yPercent: t.y },
      { xPercent: 0, yPercent: 0, duration, ease },
    ) as { kill(): void }
  }
  const onLeave = (e: Event): void => {
    const dir = getMouseEnterDirection(e as MouseEvent, element)
    const t = DIRECTIONS[dir]
    if (active) active.kill()
    active = ctx.gsap.gsap.to(bg, {
      xPercent: t.x,
      yPercent: t.y,
      duration,
      ease,
    }) as { kill(): void }
  }

  element.addEventListener('mouseenter', onEnter)
  element.addEventListener('mouseleave', onLeave)
  return () => {
    element.removeEventListener('mouseenter', onEnter)
    element.removeEventListener('mouseleave', onLeave)
    if (active) active.kill()
  }
}

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate || !SUPPORTED.has(animate)) return undefined
  if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
    return undefined
  }
  if (animate === 'hover-bg-block') return setupBgBlock(ctx, element, config)
  return undefined
}

const hoverFeature: FeatureModule = {
  name: 'hover',
  requiredPlugins: [],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(elementMatches)
    for (const element of subjects) {
      const attrs = readAttrs(element)
      ctx.responsive.bind(element, attrs, ({ config }) => setupOne(ctx, element, config))
    }
    return () => {}
  },
}

export default hoverFeature
