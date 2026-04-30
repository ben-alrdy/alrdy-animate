import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { onCustomTrigger, parseTrigger } from '../../core/trigger'

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

const SUPPORTED = new Set(Object.keys(REVEAL_CLIPS))

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

function parseScrub(value: string | undefined): number | true | undefined {
  if (value === undefined) return undefined
  if (value === '' || value === 'true') return true
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : true
}

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate || !SUPPORTED.has(animate)) return undefined
  const reveal = REVEAL_CLIPS[animate]

  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration ?? 0.9)
  const delay = parseNum(config['aa-delay'], 0)
  const ease = config['aa-ease'] ?? opts.ease ?? 'power3.out'
  const scrollStart = config['aa-scroll-start'] ?? opts.scrollStart ?? 'top 92%'
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd ?? 'bottom 70%'
  const scrub = parseScrub(config['aa-scrub'])
  const again = opts.again !== false

  const fromState: Record<string, number | string> = reveal.needsOpacity
    ? { clipPath: reveal.from, opacity: 0 }
    : { clipPath: reveal.from }
  const toState: Record<string, number | string> = reveal.needsOpacity
    ? { clipPath: reveal.to, opacity: 1 }
    : { clipPath: reveal.to }

  const trigger = parseTrigger(config['aa-trigger'])

  if (trigger.kind === 'event' && trigger.eventName) {
    ctx.gsap.gsap.set(element, fromState)
    const eventName = trigger.eventName
    const off = onCustomTrigger((target, name) => {
      if (name !== eventName) return
      if (target !== element && !target.contains(element)) return
      ctx.gsap.gsap.to(element, { ...toState, duration, ease, delay })
    })
    return () => off()
  }

  const stConfig: Record<string, unknown> = {
    trigger: element,
    start: scrollStart,
    end: scrollEnd,
    toggleActions: again ? 'play none none reverse' : 'play none none none',
  }
  if (scrub !== undefined) stConfig.scrub = scrub

  ctx.gsap.gsap.fromTo(element, fromState, {
    ...toState,
    duration,
    ease,
    delay,
    scrollTrigger: stConfig,
  })

  return undefined
}

const revealFeature: FeatureModule = {
  name: 'reveal',
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

export default revealFeature
