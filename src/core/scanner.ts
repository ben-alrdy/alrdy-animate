import { VALUE_BEARING_ATTRS } from './settings'

const FEATURE_ANCHOR_ATTRS = [
  'aa-accordion',
  'aa-marquee',
  'aa-nav',
  'aa-slider',
  'aa-modal-name',
  'aa-modal-target',
  'aa-split',
] as const

export type FeatureName =
  | 'scroll'
  | 'text'
  | 'reveal'
  | 'parallax'
  | 'hover'
  | 'accordion'
  | 'marquee'
  | 'nav'
  | 'slider'
  | 'modal'
  | 'split'

export interface ScanResult {
  elements: Element[]
  features: Set<FeatureName>
}

const ANIMATE_TO_FEATURE: Array<[RegExp, FeatureName]> = [
  [/^text-/, 'text'],
  [/^hover-/, 'hover'],
  [/^parallax/, 'parallax'],
  [/^reveal/, 'reveal'],
]

function classifyAnimateValue(value: string | null): FeatureName {
  if (!value) return 'scroll'
  const head = value.split('|')[0].trim()
  for (const [pattern, feature] of ANIMATE_TO_FEATURE) {
    if (pattern.test(head)) return feature
  }
  return 'scroll'
}

export function scan(root: ParentNode = document): ScanResult {
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
      if (attr === 'aa-accordion') features.add('accordion')
      else if (attr === 'aa-marquee') features.add('marquee')
      else if (attr === 'aa-nav') features.add('nav')
      else if (attr === 'aa-slider') features.add('slider')
      else if (attr === 'aa-modal-name' || attr === 'aa-modal-target') features.add('modal')
      else if (attr === 'aa-split') features.add('split')
    }
  }

  return { elements: Array.from(elements), features }
}
