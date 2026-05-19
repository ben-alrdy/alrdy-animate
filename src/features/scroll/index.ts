import { bindFeature, type FeatureContext, type FeatureModule } from '../../core/registry'
import { readAnimationConfig, resolveAnchor } from '../../core/parse'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import type { Config } from '../../core/settings'
import {
  buildStagger,
  defaultStaggerFor,
  parseStaggerSpec,
  type StaggerValue,
} from '../../core/stagger'
import { setupTriggeredAnimation } from '../../core/triggered-animation'
import { resolveTriggers } from '../../core/trigger'

type FromState = Record<string, number | string>

const FROM_FOR: Record<string, (intensity: number) => FromState> = {
  fade: () => ({ opacity: 0 }),
  'fade-up': (i) => ({ y: `${3 * i}rem`, opacity: 0 }),
  'fade-down': (i) => ({ y: `${-3 * i}rem`, opacity: 0 }),
  'fade-left': (i) => ({ x: `${3 * i}rem`, opacity: 0 }),
  'fade-right': (i) => ({ x: `${-3 * i}rem`, opacity: 0 }),
  'zoom-in': () => ({ scale: 0.85, opacity: 0 }),
  'zoom-out': () => ({ scale: 1.15, opacity: 0 }),
  'slide-up': (i) => ({ yPercent: 100 * i }),
  'slide-down': (i) => ({ yPercent: -100 * i }),
  'slide-left': (i) => ({ xPercent: 100 * i }),
  'slide-right': (i) => ({ xPercent: -100 * i }),
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

function buildRotateFromState(value: string, intensity: number): FromState {
  const ccw = value.endsWith('-ccw')
  const cornerMatch = value.match(/-(tl|tr|bl|br)(?:-|$)/)
  const corner = cornerMatch ? cornerMatch[1] : null
  const up = /^rotate-up(?:-|$)/.test(value)
  // CSS rotation: positive = clockwise tilt. We start at the inverse of the
  // intended motion direction and animate back to 0, so a clockwise (default)
  // entrance starts from a negative tilt; -ccw starts positive.
  const degrees = 5 * intensity * (ccw ? 1 : -1)
  const state: FromState = { rotation: degrees, opacity: 0 }
  if (up) state.y = `${3 * intensity}rem`
  if (corner) state.transformOrigin = CORNER_TO_ORIGIN[corner]
  return state
}

function buildFromState(animate: string, intensity: number): FromState | undefined {
  const builder = FROM_FOR[animate]
  if (builder) return builder(intensity)
  if (isRotateValue(animate)) return buildRotateFromState(animate, intensity)
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
  const { duration, delay, ease, intensity, scrollStart, scrollEnd, scrub, again } =
    readAnimationConfig(config, opts)

  const fromState = buildFromState(animate, intensity)
  if (!fromState) return

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
  init(ctx: FeatureContext): () => void {
    bindFeature(ctx, elementMatches, setupOne)
    return () => {}
  },
}

export default scrollFeature
