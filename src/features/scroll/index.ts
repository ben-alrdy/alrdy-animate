import type { FeatureContext, FeatureModule } from '../../core/registry'
import { parseNum, parseScrub, resolveAnchor } from '../../core/parse'
import { resolveScrollStart } from '../../core/scroll-trigger'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import { readAttrs, type Config } from '../../core/settings'
import {
  buildStagger,
  defaultStaggerFor,
  parseStaggerSpec,
  type StaggerValue,
} from '../../core/stagger'
import { setupTriggeredAnimation } from '../../core/triggered-animation'
import { resolveTriggers } from '../../core/trigger'

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
  blur: () => ({ opacity: 0, filter: 'blur(20px)' }),
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

function elementMatches(el: Element, presetMap: Map<Element, ResolvedPreset>): boolean {
  return matchAnimateValue(el, presetMap, isSupportedValue)
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
  const scrollStart = resolveScrollStart(config['aa-scroll-start'], opts, scrub)
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

  const triggerEl = resolveAnchor(element, config['aa-anchor'])

  // We use gsap.from() (not fromTo) so the natural CSS state of each target —
  // its existing rotation, opacity, transform — is the destination. Authors
  // can pre-style elements (e.g. a card with permanent rotate(8deg)) and the
  // entrance still resolves to that state instead of clobbering it to 0.
  const handle = setupTriggeredAnimation(ctx, element, {
    triggers: resolveTriggers(element, config['aa-trigger']),
    delay,
    scrollStart,
    scrollEnd,
    scrub,
    again,
    triggerEl,
    buildAnimation: (vars) => {
      const animation = ctx.gsap.gsap.from(targets, {
        ...fromState,
        duration,
        ease,
        stagger,
        ...vars,
      })
      return { animation }
    },
  })

  return handle ? () => handle.dispose() : undefined
}

const scrollFeature: FeatureModule = {
  name: 'scroll',
  requiredPlugins: ['ScrollTrigger'],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter((el) => elementMatches(el, ctx.presetMap))
    for (const element of subjects) {
      const attrs = readAttrs(element, ctx.presetMap.get(element))
      ctx.responsive.bind(element, attrs, ({ config }) => setupOne(ctx, element, config))
    }
    return () => {}
  },
}

export default scrollFeature
