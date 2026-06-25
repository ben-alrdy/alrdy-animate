import type { ResolvedPreset } from './presets'
import { VALUE_BEARING_ATTRS } from './settings'

export type FeatureName =
  | 'appear'
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
  | 'stack'

export interface ScanResult {
  elements: Element[]
  features: Set<FeatureName>
  /**
   * Some element the hover feature will process resolves to the `text` head
   * (char/word lift) in some breakpoint segment — the only hover effect that
   * needs SplitText. Detected during this pass so init doesn't re-walk the DOM.
   */
  needsHoverSplit: boolean
  /**
   * A `text-*` element resolves to a **line** split (line-default animation, or
   * `aa-split` naming lines). Only line splits depend on correct font metrics
   * up front — line wrapping changes when the webfont swaps. init() awaits
   * `document.fonts.ready` only when this is set, so char/word-only and
   * non-text pages aren't delayed.
   */
  needsFontMetrics: boolean
}

// text-* animations whose default split is `lines` (mirror the line-defaulting
// entries in features/text TEXT_ANIMS — slide/tilt/oval/rotate and the bar
// reveals block/marker). Char/word defaults (fade/blur/scale) are absent.
const LINE_DEFAULT_TEXT = /^text-(slide|tilt|oval|rotate|block|marker)/

// True when a text element resolves to a line split (needs real-font metrics).
// `aa-split` wins over the animation default: an explicit `lines` forces line
// metrics; an explicit `chars`/`words` opts out even on a line-default anim.
function textWantsLineMetrics(animateValue: string | null, splitValue: string | null): boolean {
  if (!animateValue) return false
  const head = animateValue.split('|')[0].trim()
  if (!head.startsWith('text-')) return false
  if (splitValue) {
    const tokens = splitValue.toLowerCase().split(/[\s|]+/)
    if (tokens.includes('lines')) return true
    if (tokens.includes('chars') || tokens.includes('words')) return false
  }
  return LINE_DEFAULT_TEXT.test(head)
}

const HOVER_ATTRS = ['aa-hover', 'aa-hover-sm', 'aa-hover-md', 'aa-hover-lg', 'aa-hover-xl'] as const

// The hover feature requires a base `aa-hover` to process an element (see
// hover/index.ts `elementMatches`), so suffix-only hover never runs — gate on
// the base attr, then check base + suffixes for the `text` head.
function hoverWantsSplitText(el: Element): boolean {
  if (!el.hasAttribute('aa-hover')) return false
  for (const attr of HOVER_ATTRS) {
    const v = el.getAttribute(attr)
    if (v && v.split('|').some((part) => part.trim().split(/\s+/)[0] === 'text')) return true
  }
  return false
}

const ANIMATE_TO_FEATURE: Array<[RegExp, FeatureName]> = [
  [/^text-/, 'text'],
  [/^parallax/, 'parallax'],
  [/^reveal/, 'reveal'],
  [/^slices/, 'slices'],
]

export function classifyAnimateValue(value: string | null): FeatureName {
  if (!value) return 'appear'
  const head = value.split('|')[0].trim()
  for (const [pattern, feature] of ANIMATE_TO_FEATURE) {
    if (pattern.test(head)) return feature
  }
  return 'appear'
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
  ['aa-stack', 'stack'],
]

export function scan(
  root: ParentNode = document,
  presetMap: Map<Element, ResolvedPreset> = new Map(),
): ScanResult {
  const features = new Set<FeatureName>()
  const elements = new Set<Element>()
  let needsHoverSplit = false
  let needsFontMetrics = false

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
    if (!needsHoverSplit && hoverWantsSplitText(el)) needsHoverSplit = true
    if (!needsFontMetrics && textWantsLineMetrics(animateValue, el.getAttribute('aa-split'))) {
      needsFontMetrics = true
    }
  }

  // Preset-resolved elements have no `aa-*` attributes (resolvePresets skips
  // any element that already has one), so they won't be in the query above.
  // Fold them in and classify by their virtual aa-animate value.
  for (const [el, resolved] of presetMap) {
    elements.add(el)
    const animateValue = resolved.get('aa-animate') ?? null
    if (animateValue !== null) features.add(classifyAnimateValue(animateValue))
    if (!needsFontMetrics && textWantsLineMetrics(animateValue, resolved.get('aa-split') ?? null)) {
      needsFontMetrics = true
    }
  }

  return { elements: Array.from(elements), features, needsHoverSplit, needsFontMetrics }
}
