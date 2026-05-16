import { bindFeature, type FeatureContext, type FeatureModule } from '../../core/registry'
import { readAnimationConfig } from '../../core/parse'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import type { Config } from '../../core/settings'
import { setupTriggeredAnimation } from '../../core/triggered-animation'
import { resolveTriggers } from '../../core/trigger'

interface RevealClip {
  from: string
  to: string
  needsOpacity?: boolean
}

const REVEAL_CLIPS: Record<string, RevealClip> = {
  'reveal-up': { from: 'inset(100% 0 0 0)', to: 'inset(0% 0 0 0)' },
  'reveal-down': { from: 'inset(0 0 100% 0)', to: 'inset(0 0 0% 0)' },
  'reveal-left': { from: 'inset(0 0 0 100%)', to: 'inset(0 0 0 0%)' },
  'reveal-right': { from: 'inset(0 100% 0 0)', to: 'inset(0 0% 0 0)' },
  'reveal-center': {
    from: 'circle(0% at 50% 50%)',
    to: 'circle(150% at 50% 50%)',
    needsOpacity: true,
  },
  'reveal-oval-up': {
    from: 'ellipse(0% 0% at 50% 100%)',
    to: 'ellipse(150% 150% at 50% 100%)',
  },
  'reveal-oval-down': {
    from: 'ellipse(0% 0% at 50% 0%)',
    to: 'ellipse(150% 150% at 50% 0%)',
  },
}

const CLIP_VARIANTS = new Set(Object.keys(REVEAL_CLIPS))

function isSupported(name: string): boolean {
  return CLIP_VARIANTS.has(name)
}

function elementMatches(el: Element, presetMap: Map<Element, ResolvedPreset>): boolean {
  return matchAnimateValue(el, presetMap, isSupported)
}

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate) return undefined
  const reveal = REVEAL_CLIPS[animate]
  if (!reveal) return undefined

  const opts = ctx.options
  const { duration, delay, ease, scrollStart, scrollEnd, scrub, again } =
    readAnimationConfig(config, opts)

  const fromState: Record<string, number | string> = reveal.needsOpacity
    ? { clipPath: reveal.from, opacity: 0 }
    : { clipPath: reveal.from }
  const toState: Record<string, number | string> = reveal.needsOpacity
    ? { clipPath: reveal.to, opacity: 1 }
    : { clipPath: reveal.to }

  const handle = setupTriggeredAnimation(ctx, element, {
    triggers: resolveTriggers(element, config['aa-trigger']),
    delay,
    scrollStart,
    scrollEnd,
    scrub,
    again,
    buildAnimation: (vars) => {
      const animation = ctx.gsap.gsap.fromTo(element, fromState, {
        ...toState,
        duration,
        ease,
        ...vars,
      })
      return { animation }
    },
  })

  return handle ? () => handle.dispose() : undefined
}

const revealFeature: FeatureModule = {
  name: 'reveal',
  init(ctx: FeatureContext): () => void {
    bindFeature(ctx, elementMatches, setupOne)
    return () => {}
  },
}

export default revealFeature
