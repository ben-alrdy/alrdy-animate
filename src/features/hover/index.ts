import { parseNum } from '../../core/parse'
import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { buildStagger, defaultStaggerFor, parseStaggerSpec } from '../../core/stagger'
import { parseSplit, type SplitMode } from '../../split/runtime'
import { parseDirectionMode } from './direction'
import {
  ICON_DIRECTIONS,
  setupBlockHover,
  setupCurveHover,
  setupIconHover,
  setupTextHover,
  setupUnderlineHover,
  type IconDirection,
} from './effects'

interface ParsedHover {
  type: 'block' | 'curve' | 'icon' | 'underline' | 'underline-in' | 'text' | null
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
  if (head === 'underline') return { type: 'underline', flags }
  if (head === 'underline-in') return { type: 'underline-in', flags }
  if (head === 'text') return { type: 'text', flags }
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
   * `aa-intensity` is a multiplier on this value, so `aa-intensity="2"` doubles
   * the gap between icons (slower trail), `aa-intensity="0.5"` halves it
   * (tighter packing). Default multiplier = 1.
   */
  cloneLagBase: 0.05,
} as const

/**
 * Scan for [aa-hover-trigger] elements once at init and map every aa-hover
 * descendant to its owning trigger. Top-down so authors can reason: "the
 * trigger wraps these children." Iteration is document-order, so nested
 * triggers correctly hand ownership to the innermost (later writes win).
 */
function buildTriggerMap(): WeakMap<Element, HTMLElement> {
  const map = new WeakMap<Element, HTMLElement>()
  if (typeof document === 'undefined') return map
  const triggers = document.querySelectorAll<HTMLElement>('[aa-hover-trigger]')
  for (const trigger of triggers) {
    if (trigger.hasAttribute('aa-hover')) map.set(trigger, trigger)
    for (const desc of trigger.querySelectorAll<HTMLElement>('[aa-hover]')) {
      map.set(desc, trigger)
    }
  }
  return map
}

function setupOne(
  ctx: FeatureContext,
  triggerMap: WeakMap<Element, HTMLElement>,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const value = config['aa-hover']
  if (!value) return
  const parsed = parseHoverValue(value)
  if (!parsed.type) return

  const host = element as HTMLElement
  // Either an ancestor (or the host itself) tagged aa-hover-trigger, or the
  // host listens to its own events when no trigger applies.
  const trigger = triggerMap.get(host) ?? host
  const duration = parseNum(config['aa-duration'], ctx.options.duration)
  const delay = parseNum(config['aa-delay'], HOVER_DEFAULTS.delay)
  const ease = config['aa-ease'] ?? ctx.options.ease
  const color = config['aa-color'] ?? 'currentColor'

  if (parsed.type === 'block') {
    return setupBlockHover(host, trigger, ctx.gsap, {
      duration,
      delay,
      ease,
      color,
      mode: parseDirectionMode(parsed.flags),
    })
  }
  if (parsed.type === 'curve') {
    return setupCurveHover(host, trigger, ctx.gsap, {
      duration,
      delay,
      ease,
      color,
      mode: parseDirectionMode(parsed.flags),
    })
  }
  if (parsed.type === 'icon' && parsed.direction) {
    const intensity = parseNum(config['aa-intensity'], 1)
    return setupIconHover(host, trigger, ctx.gsap, {
      direction: parsed.direction,
      reverse: parsed.flags.includes('reverse'),
      triple: parsed.flags.includes('triple'),
      duration,
      delay,
      ease,
      cloneLag: HOVER_DEFAULTS.cloneLagBase * intensity,
      color,
    })
  }
  if (parsed.type === 'underline' || parsed.type === 'underline-in') {
    return setupUnderlineHover(host, trigger, ctx.gsap, {
      duration,
      delay,
      ease,
      color,
      variant: parsed.type,
    })
  }
  if (parsed.type === 'text') {
    const splitMode: SplitMode = parseSplit(config['aa-split'])?.mode ?? 'chars'
    const staggerSpec = parseStaggerSpec(
      config['aa-stagger'],
      defaultStaggerFor(splitMode === 'lines' ? undefined : splitMode, ctx.options),
    )
    return setupTextHover(host, trigger, ctx.gsap, {
      duration,
      delay,
      ease,
      color,
      splitMode,
      stagger: buildStagger(staggerSpec.unit, staggerSpec.flags),
      reverse: parsed.flags.includes('reverse'),
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
    const triggerMap = buildTriggerMap()
    const subjects = ctx.elements.filter(elementMatches)
    for (const element of subjects) {
      const attrs = readAttrs(element)
      ctx.responsive.bind(element, attrs, ({ config }) =>
        setupOne(ctx, triggerMap, element, config),
      )
    }
    return () => {}
  },
}

export default hoverFeature
