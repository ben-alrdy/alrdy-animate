import type { ResolvedPreset } from './presets'
import { VALUE_BEARING_ATTRS } from './settings'

export type FeatureName =
  | 'scroll'
  | 'text'
  | 'reveal'
  | 'slices'
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
  [/^slices/, 'slices'],
]

export function classifyAnimateValue(value: string | null): FeatureName {
  if (!value) return 'scroll'
  const head = value.split('|')[0].trim()
  for (const [pattern, feature] of ANIMATE_TO_FEATURE) {
    if (pattern.test(head)) return feature
  }
  return 'scroll'
}

// Anchor attribute → feature name. Iteration order doesn't matter; classification
// runs once per element across whichever anchor attrs it carries.
const ANCHOR_TO_FEATURE: ReadonlyArray<[string, FeatureName]> = [
  ['aa-tabs', 'tabs'],
  ['aa-marquee', 'marquee'],
  ['aa-nav', 'nav'],
  ['aa-slider', 'slider'],
  ['aa-modal-group', 'modal'],
  ['aa-modal-name', 'modal'],
  ['aa-modal-target', 'modal'],
  ['aa-split', 'split'],
  ['aa-hover', 'hover'],
  ['aa-cursor', 'cursor'],
]

export function scan(
  root: ParentNode = document,
  presetMap: Map<Element, ResolvedPreset> = new Map(),
): ScanResult {
  const features = new Set<FeatureName>()
  const elements = new Set<Element>()

  // Single combined selector — one tree walk instead of 1 + 10. Classify by
  // attribute presence in JS.
  const combinedSelector = [
    ...VALUE_BEARING_ATTRS.map((a) => `[${a}]`),
    ...ANCHOR_TO_FEATURE.map(([a]) => `[${a}]`),
  ].join(',')

  for (const el of root.querySelectorAll(combinedSelector)) {
    elements.add(el)
    const animateValue = el.getAttribute('aa-animate')
    if (animateValue !== null) features.add(classifyAnimateValue(animateValue))
    for (const [attr, feature] of ANCHOR_TO_FEATURE) {
      if (el.hasAttribute(attr)) features.add(feature)
    }
  }

  // Preset-resolved elements have no `aa-*` attributes (resolvePresets skips
  // any element that already has one), so they won't be in the query above.
  // Fold them in and classify by their virtual aa-animate value.
  for (const [el, resolved] of presetMap) {
    elements.add(el)
    const animateValue = resolved.get('aa-animate') ?? null
    if (animateValue !== null) features.add(classifyAnimateValue(animateValue))
  }

  return { elements: Array.from(elements), features }
}
