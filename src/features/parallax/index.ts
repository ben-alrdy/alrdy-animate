import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'

const SUPPORTED = new Set(['parallax', 'parallax-horizontal', 'parallax-vertical'])

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

function parseScrub(value: string | undefined): number | true {
  if (value === undefined || value === '' || value === 'true') return true
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : true
}

function resolveAnchor(element: Element, anchor: string | undefined): Element {
  if (!anchor) return element
  const root = element.closest(anchor)
  if (root) return root
  const found = document.querySelector(anchor)
  return found ?? element
}

function setupOne(ctx: FeatureContext, element: Element, config: Config): undefined {
  const animate = config['aa-animate']
  if (!animate || !SUPPORTED.has(animate)) return undefined

  const isHorizontal = animate === 'parallax-horizontal'
  const prop = isHorizontal ? 'xPercent' : 'yPercent'

  const opts = ctx.options
  const distance = parseNum(config['aa-distance'], opts.distance ?? 1)
  const startVal = parseNum(config['aa-parallax-start'], 10 * distance)
  const endVal = parseNum(config['aa-parallax-end'], -10 * distance)
  const scrub = parseScrub(config['aa-scrub'])
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
  requiredPlugins: ['ScrollTrigger'],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(elementMatches)
    for (const element of subjects) {
      const attrs = readAttrs(element)
      ctx.responsive.bind(element, attrs, ({ config }) => setupOne(ctx, element, config))
    }
    return () => {}
  },
}

export default parallaxFeature
