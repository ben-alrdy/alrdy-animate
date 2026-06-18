import { bindFeature, type FeatureContext, type FeatureModule } from '../../core/registry'
import { readAnimationConfig, resolveAnchor } from '../../core/parse'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import type { Config } from '../../core/settings'
import { collectStaggerTargets } from '../../core/stagger'
import { cssWillChange, setupTriggeredAnimation } from '../../core/triggered-animation'
import { resolveTriggers } from '../../core/trigger'

type FromState = Record<string, number | string>

const FROM_FOR: Record<string, (intensity: number) => FromState> = {
  fade: () => ({ opacity: 0 }),
  'fade-up': (i) => ({ y: `${2 * i}rem`, opacity: 0 }),
  'fade-down': (i) => ({ y: `${-2 * i}rem`, opacity: 0 }),
  'fade-left': (i) => ({ x: `${2 * i}rem`, opacity: 0 }),
  'fade-right': (i) => ({ x: `${-2 * i}rem`, opacity: 0 }),
  'zoom-in': (i) => ({ scale: Math.max(0, 1 - 0.15 * i), opacity: 0 }),
  'zoom-out': (i) => ({ scale: 1 + 0.15 * i, opacity: 0 }),
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
  if (up) state.y = `${2 * intensity}rem`
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

  const triggers = resolveTriggers(element, config['aa-trigger'], ctx.options.breakpoints)
  // `aa-trigger="lcp"`: the companion CSS paints this element at ~0.01 opacity
  // before the bundle (an eligible Largest Contentful Paint candidate). Because
  // that floor is the element's *current* opacity when the tween is created,
  // gsap.from() would read 0.01 as the destination — so we pin opacity:1 first
  // (see buildAnimation). Transforms still resolve from natural CSS.
  const isLcp = triggers.some((t) => t.kind === 'lcp')

  const fromState = buildFromState(animate, intensity)
  if (!fromState) return
  // Start the fade from the CSS first-paint value (0.01) rather than 0, so the
  // hand-off from the CSS placeholder to the GSAP tween has zero opacity change.
  if (isLcp && fromState.opacity === 0) fromState.opacity = 0.01

  const { targets, stagger } = collectStaggerTargets(element, config, opts)

  const triggerEl = resolveAnchor(element, config['aa-anchor'])

  // We use gsap.from() (not fromTo) so the natural CSS state of each target —
  // its existing rotation, opacity, transform — is the destination. Authors
  // can pre-style elements (e.g. a card with permanent rotate(8deg)) and the
  // entrance still resolves to that state instead of clobbering it to 0.
  const handle = setupTriggeredAnimation(ctx, element, {
    triggers,
    delay,
    scrollStart,
    scrollEnd,
    scrub,
    again,
    triggerEl,
    willChange: cssWillChange(fromState),
    buildAnimation: (vars) => {
      // For lcp, establish opacity:1 as the .from() destination, overriding the
      // CSS 0.01 floor. set + from run synchronously, so from's immediateRender
      // overwrites the 1 with the from-value before any paint — no flash.
      if (isLcp) ctx.gsap.gsap.set(targets, { opacity: 1 })
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

const appearFeature: FeatureModule = {
  name: 'appear',
  init(ctx: FeatureContext): () => void {
    bindFeature(ctx, elementMatches, setupOne)
    return () => {}
  },
}

export default appearFeature
