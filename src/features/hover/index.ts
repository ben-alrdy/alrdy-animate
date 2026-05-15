import { parseNum } from '../../core/parse'
import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { parseDirectionMode } from './direction'
import {
  ICON_DIRECTIONS,
  setupBlockHover,
  setupCurveHover,
  setupIconHover,
  type IconDirection,
} from './effects'

interface ParsedHover {
  type: 'block' | 'curve' | 'icon' | null
  direction?: IconDirection
  flags: string[]
}

function parseHoverValue(value: string): ParsedHover {
  const tokens = value.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { type: null, flags: [] }
  const head = tokens[0]
  const flags = tokens.slice(1)

  if (head === 'block') return { type: 'block', flags }
  if (head === 'curve') return { type: 'curve', flags }
  if (head.startsWith('icon-')) {
    const dir = head.slice('icon-'.length)
    if (ICON_DIRECTIONS.has(dir)) {
      return { type: 'icon', direction: dir as IconDirection, flags }
    }
  }
  return { type: null, flags }
}

function elementMatches(el: Element): boolean {
  const value = el.getAttribute('aa-hover')
  if (!value) return false
  for (const part of value.split('|')) {
    if (parseHoverValue(part.trim()).type) return true
  }
  for (const bp of ['sm', 'md', 'lg', 'xl']) {
    const v = el.getAttribute(`aa-hover-${bp}`)
    if (v && parseHoverValue(v.trim()).type) return true
  }
  return false
}

const HOVER_DEFAULTS = {
  delay: 0,
  /**
   * Base time lag between each successive hover-icon starting its slide.
   * `aa-distance` is a multiplier on this value, so `aa-distance="2"` doubles
   * the gap between icons (slower trail), `aa-distance="0.5"` halves it
   * (tighter packing). Default multiplier = 1.
   */
  cloneLagBase: 0.05,
} as const

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const value = config['aa-hover']
  if (!value) return
  const parsed = parseHoverValue(value)
  if (!parsed.type) return

  const host = element as HTMLElement
  const duration = parseNum(config['aa-duration'], ctx.options.duration)
  const delay = parseNum(config['aa-delay'], HOVER_DEFAULTS.delay)
  const ease = config['aa-ease'] ?? ctx.options.ease
  const color = config['aa-color'] ?? 'currentColor'

  if (parsed.type === 'block') {
    return setupBlockHover(host, ctx.gsap, {
      duration,
      delay,
      ease,
      color,
      mode: parseDirectionMode(parsed.flags),
    })
  }
  if (parsed.type === 'curve') {
    return setupCurveHover(host, ctx.gsap, {
      duration,
      delay,
      ease,
      color,
      mode: parseDirectionMode(parsed.flags),
    })
  }
  if (parsed.type === 'icon' && parsed.direction) {
    const distanceMultiplier = parseNum(config['aa-distance'], 1)
    return setupIconHover(host, ctx.gsap, {
      direction: parsed.direction,
      reverse: parsed.flags.includes('reverse'),
      triple: parsed.flags.includes('triple'),
      duration,
      delay,
      ease,
      cloneLag: HOVER_DEFAULTS.cloneLagBase * distanceMultiplier,
    })
  }
  return undefined
}

const hoverFeature: FeatureModule = {
  name: 'hover',
  init(ctx: FeatureContext): () => void {
    // Skip touch-only devices entirely — hover events are unreliable there.
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
      return () => {}
    }
    const subjects = ctx.elements.filter(elementMatches)
    for (const element of subjects) {
      const attrs = readAttrs(element)
      ctx.responsive.bind(element, attrs, ({ config }) => setupOne(ctx, element, config))
    }
    return () => {}
  },
}

export default hoverFeature
