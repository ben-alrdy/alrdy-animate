import type { FeatureContext, FeatureModule } from '../../core/registry'
import { bindAgainTrigger } from '../../core/scroll-trigger'
import { readAttrs, type Config } from '../../core/settings'
import {
  buildStagger,
  defaultStaggerFor,
  parseStaggerSpec,
  type StaggerValue,
} from '../../core/stagger'
import {
  REVERSE_EASE,
  REVERSE_TIME_SCALE,
  resolveTrigger,
  subscribeWithPair,
} from '../../core/trigger'

type FromState = Record<string, number | string>

const FROM_FOR: Record<string, (distance: number) => FromState> = {
  fade: () => ({ opacity: 0 }),
  'fade-up': (d) => ({ y: `${3 * d}rem`, opacity: 0 }),
  'fade-down': (d) => ({ y: `${-3 * d}rem`, opacity: 0 }),
  'fade-left': (d) => ({ x: `${3 * d}rem`, opacity: 0 }),
  'fade-right': (d) => ({ x: `${-3 * d}rem`, opacity: 0 }),
  'zoom-in': () => ({ scale: 0.85, opacity: 0 }),
  'zoom-out': () => ({ scale: 1.15, opacity: 0 }),
  'slide-up': (d) => ({ yPercent: 100 * d }),
  'slide-down': (d) => ({ yPercent: -100 * d }),
  'slide-left': (d) => ({ xPercent: 100 * d }),
  'slide-right': (d) => ({ xPercent: -100 * d }),
  'blur-in': () => ({ opacity: 0, filter: 'blur(20px)' }),
}

const STATIC_SUPPORTED = new Set(Object.keys(FROM_FOR))

const ROTATE_PATTERN = /^rotate(?:-up)?(?:-(?:tl|tr|bl|br))?(?:-ccw)?$/

const CORNER_TO_ORIGIN: Record<string, string> = {
  tl: 'left top',
  tr: 'right top',
  bl: 'left bottom',
  br: 'right bottom',
}

function isRotateValue(value: string): boolean {
  return ROTATE_PATTERN.test(value)
}

function buildRotateFromState(value: string, distance: number): FromState {
  const ccw = value.endsWith('-ccw')
  const cornerMatch = value.match(/-(tl|tr|bl|br)(?:-|$)/)
  const corner = cornerMatch ? cornerMatch[1] : null
  const up = /^rotate-up(?:-|$)/.test(value)
  // CSS rotation: positive = clockwise tilt. We start at the inverse of the
  // intended motion direction and animate back to 0, so a clockwise (default)
  // entrance starts from a negative tilt; -ccw starts positive.
  const degrees = 5 * distance * (ccw ? 1 : -1)
  const state: FromState = { rotation: degrees, opacity: 0 }
  if (up) state.y = `${3 * distance}rem`
  if (corner) state.transformOrigin = CORNER_TO_ORIGIN[corner]
  return state
}

function buildFromState(animate: string, distance: number): FromState | undefined {
  const builder = FROM_FOR[animate]
  if (builder) return builder(distance)
  if (isRotateValue(animate)) return buildRotateFromState(animate, distance)
  return undefined
}

function isSupportedValue(value: string): boolean {
  return STATIC_SUPPORTED.has(value) || isRotateValue(value)
}

function elementMatches(el: Element): boolean {
  const value = el.getAttribute('aa-animate')
  if (!value) return false
  for (const part of value.split('|')) {
    if (isSupportedValue(part.trim())) return true
  }
  for (const bp of ['sm', 'md', 'lg', 'xl']) {
    const v = el.getAttribute(`aa-animate-${bp}`)
    if (v && isSupportedValue(v.trim())) return true
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

  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration)
  const delay = parseNum(config['aa-delay'], 0)
  const ease = config['aa-ease'] ?? opts.ease
  const distance = parseNum(config['aa-distance'], opts.distance)

  const fromState = buildFromState(animate, distance)
  if (!fromState) return

  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd
  const scrub = parseScrub(config['aa-scrub'])
  const scrollStart =
    config['aa-scroll-start'] ??
    (scrub !== undefined ? opts.scrubStart : undefined) ??
    opts.scrollStart
  const again = opts.again !== false

  // aa-stagger present + element has children → stagger the children.
  // aa-stagger present but no children → silently fall through and animate the element itself.
  const wantsStagger = config['aa-stagger'] !== undefined
  const children = wantsStagger
    ? Array.from(element.children).filter((c): c is Element => c.nodeType === 1)
    : []
  const targets: Element[] = children.length > 0 ? children : [element]
  const staggerSpec = parseStaggerSpec(config['aa-stagger'], defaultStaggerFor(undefined, opts))
  const stagger: StaggerValue =
    children.length > 0 ? buildStagger(staggerSpec.unit, staggerSpec.flags) : 0

  const trigger = resolveTrigger(element, config['aa-trigger'])

  // Use gsap.from() (not fromTo) so the natural CSS state of each target —
  // its existing rotation, opacity, transform — is the destination. Authors
  // can pre-style elements (e.g. a card with permanent rotate(8deg)) and the
  // entrance still resolves to that state instead of clobbering it to 0.

  if (trigger.kind === 'event' && trigger.eventName) {
    const tween = ctx.gsap.gsap.from(targets, {
      ...fromState,
      duration,
      ease,
      easeReverse: REVERSE_EASE,
      delay,
      stagger,
      paused: true,
    })
    const off = subscribeWithPair({
      element,
      forwardName: trigger.eventName,
      // Always restart from time 0 so a reactivation lands on the FROM state
      // even if the previous reverse hadn't finished. Reset timeScale to 1
      // so a prior reverse doesn't leave the forward accelerated.
      onForward: () => tween.timeScale(1).play(0),
      onReverse: () => tween.timeScale(REVERSE_TIME_SCALE).reverse(),
    })
    return () => off()
  }

  const triggerEl = resolveAnchor(element, config['aa-anchor'])

  if (scrub !== undefined) {
    ctx.gsap.gsap.from(targets, {
      ...fromState,
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

  const tl = ctx.gsap.gsap.timeline({ paused: true })
  tl.from(targets, { ...fromState, duration, ease, delay, stagger })

  bindAgainTrigger({
    gsap: ctx.gsap,
    trigger: triggerEl,
    start: scrollStart,
    again,
    onPlay: () => tl.play(),
    onReset: () => {
      tl.progress(0).pause()
    },
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
