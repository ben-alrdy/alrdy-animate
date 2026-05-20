import type { FeatureContext, FeatureModule } from '../core/registry'
import { readAttrs } from '../core/settings'
import { applySplit, parseSplit } from './runtime'

function shouldSkip(el: Element): boolean {
  // The text feature handles its own split.
  const animate = el.getAttribute('aa-animate') ?? ''
  for (const part of animate.split('|')) {
    if (part.trim().startsWith('text-')) return true
  }
  for (const bp of ['sm', 'md', 'lg', 'xl']) {
    const v = el.getAttribute(`aa-animate-${bp}`)
    if (v && v.startsWith('text-')) return true
  }
  return false
}

const splitFeature: FeatureModule = {
  name: 'split',
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(
      (el) => el.hasAttribute('aa-split') && !shouldSkip(el),
    )
    for (const element of subjects) {
      const attrs = readAttrs(element)
      ctx.responsive.bind(element, attrs, ({ config }) => {
        const split = parseSplit(config['aa-split'])
        if (!split) return
        const result = applySplit(element, split.mode, ctx.gsap, {
          mask: split.mask,
          index: split.index,
        })
        return () => result.revert()
      })
    }
    return () => {}
  },
}

export default splitFeature
