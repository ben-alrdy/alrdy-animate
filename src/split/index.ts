import type { FeatureContext, FeatureModule } from '../core/registry'
import { readAttrs } from '../core/settings'
import { applySplit, parseSplitMode } from './runtime'

function shouldSkip(el: Element): boolean {
  // Text and hover-text features handle their own split.
  const animate = el.getAttribute('aa-animate') ?? ''
  for (const part of animate.split('|')) {
    const head = part.trim()
    if (head.startsWith('text-') || head.startsWith('hover-text-')) return true
  }
  for (const bp of ['sm', 'md', 'lg', 'xl']) {
    const v = el.getAttribute(`aa-animate-${bp}`)
    if (v && (v.startsWith('text-') || v.startsWith('hover-text-'))) return true
  }
  return false
}

const splitFeature: FeatureModule = {
  name: 'split',
  // SplitText is optional — words/chars use a regex fallback.
  requiredPlugins: [],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(
      (el) => el.hasAttribute('aa-split') && !shouldSkip(el),
    )
    for (const element of subjects) {
      const attrs = readAttrs(element)
      ctx.responsive.bind(element, attrs, ({ config }) => {
        const mode = parseSplitMode(config['aa-split'])
        if (!mode) return
        const result = applySplit(element, mode, ctx.gsap)
        return () => result.revert()
      })
    }
    return () => {}
  },
}

export default splitFeature
