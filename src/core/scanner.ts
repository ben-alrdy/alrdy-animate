import type { ResolvedPreset } from './presets'
import { VALUE_BEARING_ATTRS } from './settings'

const FEATURE_ANCHOR_ATTRS = [
  'aa-tabs',
  'aa-marquee',
  'aa-nav',
  'aa-slider',
  'aa-modal-group',
  'aa-modal-name',
  'aa-modal-target',
  'aa-split',
  'aa-hover',
  'aa-cursor',
] as const

export type FeatureName =
  | 'scroll'
  | 'text'
  | 'reveal'
  | 'parallax'
  | 'tabs'
  | 'marquee'
  | 'nav'
  | 'slider'
  | 'modal'
  | 'split'
  | 'hover'
  | 'cursor'

export interface ScanResult {
  elements: Element[]
  features: Set<FeatureName>
}

const ANIMATE_TO_FEATURE: Array<[RegExp, FeatureName]> = [
  [/^text-/, 'text'],
  [/^parallax/, 'parallax'],
  [/^reveal/, 'reveal'],
]

export function classifyAnimateValue(value: string | null): FeatureName {
  if (!value) return 'scroll'
  const head = value.split('|')[0].trim()
  for (const [pattern, feature] of ANIMATE_TO_FEATURE) {
    if (pattern.test(head)) return feature
  }
  return 'scroll'
}

export function scan(
  root: ParentNode = document,
  presetMap: Map<Element, ResolvedPreset> = new Map(),
): ScanResult {
  const features = new Set<FeatureName>()
  const elements = new Set<Element>()

  const animateSelector = VALUE_BEARING_ATTRS.map((a) => `[${a}]`).join(',')
  for (const el of root.querySelectorAll(animateSelector)) {
    elements.add(el)
    const animateValue = el.getAttribute('aa-animate')
    if (animateValue !== null) features.add(classifyAnimateValue(animateValue))
  }

  for (const attr of FEATURE_ANCHOR_ATTRS) {
    for (const el of root.querySelectorAll(`[${attr}]`)) {
      elements.add(el)
      if (attr === 'aa-tabs') features.add('tabs')
      else if (attr === 'aa-marquee') features.add('marquee')
      else if (attr === 'aa-nav') features.add('nav')
      else if (attr === 'aa-slider') features.add('slider')
      else if (attr === 'aa-modal-group' || attr === 'aa-modal-name' || attr === 'aa-modal-target')
        features.add('modal')
      else if (attr === 'aa-split') features.add('split')
      else if (attr === 'aa-hover') features.add('hover')
      else if (attr === 'aa-cursor') features.add('cursor')
    }
  }

  // Preset-resolved elements have no `aa-*` attributes (resolvePresets skips
  // any element that already has one), so they won't be in the queries above.
  // Fold them in and classify by their virtual aa-animate value.
  for (const [el, resolved] of presetMap) {
    elements.add(el)
    const animateValue = resolved.get('aa-animate') ?? null
    if (animateValue !== null) features.add(classifyAnimateValue(animateValue))
  }

  return { elements: Array.from(elements), features }
}
