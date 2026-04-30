import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { onCustomTrigger, parseTrigger } from '../../core/trigger'

type FromState = Record<string, number | string>
type ToState = Record<string, number | string>

const FROM_FOR: Record<string, (distance: number) => FromState> = {
  fade: () => ({ opacity: 0 }),
  'fade-up': (d) => ({ y: 50 * d, opacity: 0 }),
  'fade-down': (d) => ({ y: -50 * d, opacity: 0 }),
  'fade-left': (d) => ({ x: 50 * d, opacity: 0 }),
  'fade-right': (d) => ({ x: -50 * d, opacity: 0 }),
  'zoom-in': () => ({ scale: 0.85, opacity: 0 }),
  'zoom-out': () => ({ scale: 1.15, opacity: 0 }),
  'slide-up': (d) => ({ y: 100 * d }),
  'slide-down': (d) => ({ y: -100 * d }),
  'slide-left': (d) => ({ x: 100 * d }),
  'slide-right': (d) => ({ x: -100 * d }),
  'blur-in': () => ({ opacity: 0, filter: 'blur(20px)' }),
}

const TO_FOR: Record<string, ToState> = {
  fade: { opacity: 1 },
  'fade-up': { y: 0, opacity: 1 },
  'fade-down': { y: 0, opacity: 1 },
  'fade-left': { x: 0, opacity: 1 },
  'fade-right': { x: 0, opacity: 1 },
  'zoom-in': { scale: 1, opacity: 1 },
  'zoom-out': { scale: 1, opacity: 1 },
  'slide-up': { y: 0 },
  'slide-down': { y: 0 },
  'slide-left': { x: 0 },
  'slide-right': { x: 0 },
  'blur-in': { opacity: 1, filter: 'blur(0px)' },
}

const SUPPORTED = new Set(Object.keys(FROM_FOR))

function elementMatches(el: Element): boolean {
  const value = el.getAttribute('aa-animate')
  if (!value) return false
  for (const part of value.split('|')) {
    if (SUPPORTED.has(part.trim())) return true
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

function parseScrub(value: string | undefined): number | boolean | undefined {
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
  if (!animate) return
  const fromBuilder = FROM_FOR[animate]
  const toState = TO_FOR[animate]
  if (!fromBuilder || !toState) return

  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration ?? 0.6)
  const delay = parseNum(config['aa-delay'], 0)
  const ease = config['aa-ease'] ?? opts.ease ?? 'power4.out'
  const distance = parseNum(config['aa-distance'], opts.distance ?? 1)
  const scrollStart = config['aa-scroll-start'] ?? opts.scrollStart ?? 'top 92%'
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd ?? 'bottom 70%'
  const scrub = parseScrub(config['aa-scrub'])
  const again = opts.again !== false

  const fromState = fromBuilder(distance)
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

const scrollFeature: FeatureModule = {
  name: 'scroll',
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

export default scrollFeature
