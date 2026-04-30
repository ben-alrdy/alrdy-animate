import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { onCustomTrigger, parseTrigger } from '../../core/trigger'

type FromState = Record<string, number | string>
type ToState = Record<string, number | string>

const FROM_FOR: Record<string, (distance: number) => FromState> = {
  fade: () => ({ opacity: 0 }),
  'fade-up': (d) => ({ y: `${3 * d}rem`, opacity: 0 }),
  'fade-down': (d) => ({ y: `${-3 * d}rem`, opacity: 0 }),
  'fade-left': (d) => ({ x: `${3 * d}rem`, opacity: 0 }),
  'fade-right': (d) => ({ x: `${-3 * d}rem`, opacity: 0 }),
  'zoom-in': () => ({ scale: 0.85, opacity: 0 }),
  'zoom-out': () => ({ scale: 1.15, opacity: 0 }),
  'slide-up': (d) => ({ y: `${6 * d}rem` }),
  'slide-down': (d) => ({ y: `${-6 * d}rem` }),
  'slide-left': (d) => ({ x: `${6 * d}rem` }),
  'slide-right': (d) => ({ x: `${-6 * d}rem` }),
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

function resolveAnchor(element: Element, anchor: string | undefined): Element {
  if (!anchor) return element
  const root = element.closest(anchor)
  if (root) return root
  const found = document.querySelector(anchor)
  return found ?? element
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
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd ?? 'bottom 70%'
  const scrub = parseScrub(config['aa-scrub'])
  const scrollStart =
    config['aa-scroll-start'] ??
    (scrub !== undefined ? opts.scrubStart : undefined) ??
    opts.scrollStart ??
    'top 92%'
  const again = opts.again !== false

  // aa-stagger present + element has children → stagger the children.
  // aa-stagger present but no children → silently fall through and animate the element itself.
  const wantsStagger = config['aa-stagger'] !== undefined
  const children = wantsStagger
    ? Array.from(element.children).filter((c): c is Element => c.nodeType === 1)
    : []
  const targets: Element[] = children.length > 0 ? children : [element]
  const stagger = children.length > 0 ? parseNum(config['aa-stagger'], 0.1) : 0

  const fromState = fromBuilder(distance)
  const trigger = parseTrigger(config['aa-trigger'])

  if (trigger.kind === 'event' && trigger.eventName) {
    ctx.gsap.gsap.set(targets, fromState)
    const eventName = trigger.eventName
    const off = onCustomTrigger((target, name) => {
      if (name !== eventName) return
      if (target !== element && !target.contains(element)) return
      ctx.gsap.gsap.to(targets, { ...toState, duration, ease, delay, stagger })
    })
    return () => off()
  }

  const triggerEl = resolveAnchor(element, config['aa-anchor'])

  if (scrub !== undefined) {
    ctx.gsap.gsap.fromTo(targets, fromState, {
      ...toState,
      duration,
      ease,
      delay,
      stagger,
      scrollTrigger: {
        trigger: triggerEl,
        start: scrollStart,
        end: scrollEnd,
        scrub,
      },
    })
    return undefined
  }

  const ScrollTrigger = ctx.gsap.plugins.ScrollTrigger as
    | { create: (vars: Record<string, unknown>) => unknown }
    | undefined
  if (!ScrollTrigger) return undefined

  const tl = ctx.gsap.gsap.timeline({ paused: true })
  tl.fromTo(targets, fromState, { ...toState, duration, ease, delay, stagger })

  ScrollTrigger.create({
    trigger: triggerEl,
    start: scrollStart,
    onEnter: () => tl.play(),
  })

  if (again) {
    ScrollTrigger.create({
      trigger: triggerEl,
      start: () => {
        const rect = triggerEl.getBoundingClientRect()
        const matrix = new DOMMatrix(getComputedStyle(triggerEl).transform)
        return rect.top + window.scrollY - matrix.f - window.innerHeight
      },
      onLeaveBack: () => {
        tl.progress(0).pause()
      },
    })
  }

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
