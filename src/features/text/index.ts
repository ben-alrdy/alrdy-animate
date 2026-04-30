import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { onCustomTrigger, parseTrigger } from '../../core/trigger'
import { applySplit, parseSplitMode, type SplitMode } from '../../split/runtime'

interface TextAnim {
  defaultSplit: SplitMode
  defaultStagger: number
  maskLines?: boolean
  buildFrom: (distance: number) => Record<string, number | string>
  to: Record<string, number | string>
}

const TEXT_ANIMS: Record<string, TextAnim> = {
  'text-fade': {
    defaultSplit: 'chars',
    defaultStagger: 0.02,
    buildFrom: () => ({ opacity: 0 }),
    to: { opacity: 1 },
  },
  'text-fade-up': {
    defaultSplit: 'words',
    defaultStagger: 0.05,
    buildFrom: (d) => ({ opacity: 0, yPercent: 60 * d }),
    to: { opacity: 1, yPercent: 0 },
  },
  'text-fade-down': {
    defaultSplit: 'words',
    defaultStagger: 0.05,
    buildFrom: (d) => ({ opacity: 0, yPercent: -60 * d }),
    to: { opacity: 1, yPercent: 0 },
  },
  'text-fade-left': {
    defaultSplit: 'words',
    defaultStagger: 0.05,
    buildFrom: (d) => ({ opacity: 0, xPercent: 60 * d }),
    to: { opacity: 1, xPercent: 0 },
  },
  'text-fade-right': {
    defaultSplit: 'words',
    defaultStagger: 0.05,
    buildFrom: (d) => ({ opacity: 0, xPercent: -60 * d }),
    to: { opacity: 1, xPercent: 0 },
  },
  'text-blur': {
    defaultSplit: 'chars',
    defaultStagger: 0.02,
    buildFrom: () => ({ opacity: 0, filter: 'blur(20px)' }),
    to: { opacity: 1, filter: 'blur(0px)' },
  },
  'text-slide-up': {
    defaultSplit: 'lines',
    defaultStagger: 0.1,
    maskLines: true,
    buildFrom: () => ({ yPercent: 110 }),
    to: { yPercent: 0 },
  },
  'text-slide-down': {
    defaultSplit: 'lines',
    defaultStagger: 0.1,
    maskLines: true,
    buildFrom: () => ({ yPercent: -110 }),
    to: { yPercent: 0 },
  },
}

const SUPPORTED = new Set(Object.keys(TEXT_ANIMS))

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

function pickPartTargets(
  parts: { words: HTMLElement[]; chars: HTMLElement[]; lines: HTMLElement[] },
  mode: SplitMode,
): HTMLElement[] {
  if (mode === 'chars') return parts.chars
  if (mode === 'lines') return parts.lines
  return parts.words
}

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate || !SUPPORTED.has(animate)) return undefined
  const anim = TEXT_ANIMS[animate]

  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration ?? 0.6)
  const delay = parseNum(config['aa-delay'], 0)
  const ease = config['aa-ease'] ?? opts.ease ?? 'power3.out'
  const distance = parseNum(config['aa-distance'], opts.distance ?? 1)
  const stagger = parseNum(config['aa-stagger'], anim.defaultStagger)
  const scrollStart = config['aa-scroll-start'] ?? opts.scrollStart ?? 'top 92%'
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd ?? 'bottom 70%'
  const again = opts.again !== false

  const splitMode = parseSplitMode(config['aa-split']) ?? anim.defaultSplit
  const splitOpts = anim.maskLines ? { maskLines: true } : {}
  const result = applySplit(element, splitMode, ctx.gsap, splitOpts)
  const targets = pickPartTargets(result, splitMode)
  if (targets.length === 0) {
    return () => result.revert()
  }

  const fromState = anim.buildFrom(distance)
  const trigger = parseTrigger(config['aa-trigger'])

  if (trigger.kind === 'event' && trigger.eventName) {
    ctx.gsap.gsap.set(targets, fromState)
    const eventName = trigger.eventName
    const off = onCustomTrigger((target, name) => {
      if (name !== eventName) return
      if (target !== element && !target.contains(element)) return
      ctx.gsap.gsap.to(targets, { ...anim.to, duration, ease, delay, stagger })
    })
    return () => {
      off()
      result.revert()
    }
  }

  ctx.gsap.gsap.fromTo(targets, fromState, {
    ...anim.to,
    duration,
    ease,
    delay,
    stagger,
    scrollTrigger: {
      trigger: element,
      start: scrollStart,
      end: scrollEnd,
      toggleActions: again ? 'play none none reverse' : 'play none none none',
    },
  })

  return () => result.revert()
}

const textFeature: FeatureModule = {
  name: 'text',
  requiredPlugins: ['ScrollTrigger', 'SplitText'],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(elementMatches)
    for (const element of subjects) {
      const attrs = readAttrs(element)
      ctx.responsive.bind(element, attrs, ({ config }) => setupOne(ctx, element, config))
    }
    return () => {}
  },
}

export default textFeature
