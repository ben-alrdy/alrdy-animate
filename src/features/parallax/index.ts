import { bindFeature, type FeatureContext, type FeatureModule } from '../../core/registry'
import { parseNum, parseScrub, resolveAnchor } from '../../core/parse'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import type { Config } from '../../core/settings'

const SUPPORTED = new Set(['parallax', 'parallax-horizontal', 'parallax-vertical'])

function elementMatches(el: Element, presetMap: Map<Element, ResolvedPreset>): boolean {
  return matchAnimateValue(el, presetMap, (v) => SUPPORTED.has(v))
}

function setupOne(ctx: FeatureContext, element: Element, config: Config): undefined {
  const animate = config['aa-animate']
  if (!animate || !SUPPORTED.has(animate)) return undefined

  const isHorizontal = animate === 'parallax-horizontal'
  const prop = isHorizontal ? 'xPercent' : 'yPercent'

  const opts = ctx.options
  const distance = parseNum(config['aa-distance'], opts.distance)
  const startVal = parseNum(config['aa-parallax-start'], 10 * distance)
  const endVal = parseNum(config['aa-parallax-end'], -10 * distance)
  // Parallax defaults to scrubbed when aa-scrub is absent.
  const scrub = parseScrub(config['aa-scrub']) ?? true
  // Wrapping in clamp() makes the trigger behave correctly when the element
  // already overlaps the start position at page load (hero parallax).
  const scrollStart = `clamp(${config['aa-scroll-start'] ?? 'top bottom'})`
  const scrollEnd = `clamp(${config['aa-scroll-end'] ?? 'bottom top'})`
  const triggerEl = resolveAnchor(element, config['aa-anchor'])

  ctx.gsap.gsap.fromTo(
    element,
    { [prop]: startVal },
    {
      [prop]: endVal,
      ease: 'none',
      scrollTrigger: {
        trigger: triggerEl,
        start: scrollStart,
        end: scrollEnd,
        scrub,
      },
    },
  )

  return undefined
}

const parallaxFeature: FeatureModule = {
  name: 'parallax',
  init(ctx: FeatureContext): () => void {
    bindFeature(ctx, elementMatches, setupOne)
    return () => {}
  },
}

export default parallaxFeature
