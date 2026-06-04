import { bindFeature, type FeatureContext, type FeatureModule } from '../../core/registry'
import { parseNum, readAnimationConfig } from '../../core/parse'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import type { Config } from '../../core/settings'
import { defaultStaggerFor } from '../../core/stagger'
import { setupTriggeredAnimation } from '../../core/triggered-animation'
import { resolveTriggers } from '../../core/trigger'

type Direction = 'up' | 'down' | 'left' | 'right'
type Mode = 'reveal' | 'cover'

interface SlicesParams {
  direction: Direction
  mode: Mode
  rows: number
}

const DIRECTIONS: Record<string, Direction> = {
  '': 'up',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
}

/**
 * `aa-animate` for slices is direction-suffixed; mode and row count are
 * space-separated flags on the same attribute:
 *   slices                 → reveal, up, 6 rows (defaults)
 *   slices-down            → reveal, down, 6 rows
 *   slices-right 12        → reveal, right, 12 rows
 *   slices-left cover 8    → cover, left, 8 rows
 *   slices 12 cover        → cover, up, 12 rows (order-independent flags)
 */
export function parseSlicesValue(value: string): SlicesParams | null {
  const tokens = value.trim().split(/\s+/)
  const head = tokens[0]
  if (head !== 'slices' && !head.startsWith('slices-')) return null
  const dirToken = head === 'slices' ? '' : head.slice('slices-'.length)
  const direction = DIRECTIONS[dirToken]
  if (!direction) return null

  let mode: Mode = 'reveal'
  let rows = 6
  for (const token of tokens.slice(1)) {
    if (token === 'cover' || token === 'reveal') {
      mode = token
      continue
    }
    const n = parseInt(token, 10)
    if (Number.isFinite(n) && n > 0) rows = n
  }
  return { direction, mode, rows }
}

function isSupported(value: string): boolean {
  return parseSlicesValue(value) !== null
}

function elementMatches(el: Element, presetMap: Map<Element, ResolvedPreset>): boolean {
  return matchAnimateValue(el, presetMap, isSupported)
}

interface AxisConfig {
  flexDirection: 'column' | 'row'
  marginAxis: 'margin-bottom' | 'margin-right'
  scaleProp: 'scaleY' | 'scaleX'
  /** Anchor edge during the scale. In reveal mode the origin is the *same*
   *  side as the named direction so each slice collapses toward the next
   *  still-covered slice (the bottom slice on `slices-up` shrinks upward into
   *  the slice above). In cover mode the origin is the *opposite* side so the
   *  slice grows in the named direction. */
  revealOrigin: 'top center' | 'bottom center' | 'left center' | 'right center'
  coverOrigin: 'top center' | 'bottom center' | 'left center' | 'right center'
  /** Stagger order so the cumulative reveal sweeps *toward* the named direction. */
  staggerFrom: 'start' | 'end'
}

const AXIS: Record<Direction, AxisConfig> = {
  up: {
    flexDirection: 'column',
    marginAxis: 'margin-bottom',
    scaleProp: 'scaleY',
    revealOrigin: 'top center',
    coverOrigin: 'bottom center',
    staggerFrom: 'end',
  },
  down: {
    flexDirection: 'column',
    marginAxis: 'margin-bottom',
    scaleProp: 'scaleY',
    revealOrigin: 'bottom center',
    coverOrigin: 'top center',
    staggerFrom: 'start',
  },
  left: {
    flexDirection: 'row',
    marginAxis: 'margin-right',
    scaleProp: 'scaleX',
    revealOrigin: 'left center',
    coverOrigin: 'right center',
    staggerFrom: 'end',
  },
  right: {
    flexDirection: 'row',
    marginAxis: 'margin-right',
    scaleProp: 'scaleX',
    revealOrigin: 'right center',
    coverOrigin: 'left center',
    staggerFrom: 'start',
  },
}

interface SlicesSetup {
  panel: HTMLElement
  slices: HTMLElement[]
  prevPosition: string
  prevOverflow: string
}

function buildSlicesPanel(
  element: HTMLElement,
  rows: number,
  axis: AxisConfig,
): SlicesSetup {
  const cs = window.getComputedStyle(element)
  const prevPosition = cs.position === 'static' ? '' : cs.position
  const prevOverflow = cs.overflow

  if (cs.position === 'static') element.style.position = 'relative'
  if (cs.overflow === 'visible') element.style.overflow = 'hidden'

  const panel = document.createElement('div')
  panel.className = 'aa-slices-panel'
  panel.setAttribute(
    'style',
    `position:absolute;inset:0;display:flex;flex-direction:${axis.flexDirection};pointer-events:none;z-index:2`,
  )

  const slices: HTMLElement[] = []
  const fragment = document.createDocumentFragment()
  // -1px overlap on the stacking axis eliminates hairline seams between
  // fractional-height flex children. Flex redistributes the lost space.
  const overlap = `${axis.marginAxis}:-1px`
  for (let i = 0; i < rows; i++) {
    const slice = document.createElement('div')
    slice.className = 'aa-slice'
    slice.setAttribute(
      'style',
      `flex:1 1 auto;background:currentColor;will-change:transform;backface-visibility:hidden;${overlap}`,
    )
    fragment.appendChild(slice)
    slices.push(slice)
  }
  panel.appendChild(fragment)
  element.appendChild(panel)

  return { panel, slices, prevPosition, prevOverflow }
}

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate) return undefined
  const params = parseSlicesValue(animate)
  if (!params) return undefined

  const opts = ctx.options
  const { direction, mode, rows } = params
  const axis = AXIS[direction]
  const { duration, ease, scrollStart, scrollEnd, scrub, again } =
    readAnimationConfig(config, opts)
  const stagger = parseNum(config['aa-stagger'], defaultStaggerFor(undefined, opts))

  // Reveal: slices start at scale 1 (covering) and scale to 0 with origin
  // pinned to the named direction's opposite edge, so they collapse *toward*
  // that edge — i.e. disappear in the named direction.
  // Cover: inverse — start at 0, grow to 1 with origin on the opposite edge.
  const fromScale = mode === 'cover' ? 0 : 1
  const toScale = mode === 'cover' ? 1 : 0
  const origin = mode === 'cover' ? axis.coverOrigin : axis.revealOrigin

  const setup = buildSlicesPanel(element as HTMLElement, rows, axis)
  ctx.gsap.gsap.set(setup.slices, { [axis.scaleProp]: fromScale, transformOrigin: origin })

  const cleanup = (): void => {
    ctx.gsap.gsap.killTweensOf(setup.slices)
    setup.panel.remove()
    const el = element as HTMLElement
    if (setup.prevPosition === '') el.style.removeProperty('position')
    if (setup.prevOverflow === 'visible') el.style.removeProperty('overflow')
  }

  const handle = setupTriggeredAnimation(ctx, element, {
    triggers: resolveTriggers(element, config['aa-trigger'], ctx.options.breakpoints),
    delay: 0,
    scrollStart,
    scrollEnd,
    scrub,
    again,
    buildAnimation: (vars) => {
      const animation = ctx.gsap.gsap.to(setup.slices, {
        [axis.scaleProp]: toScale,
        duration,
        ease,
        stagger: { each: stagger, from: axis.staggerFrom },
        ...vars,
      })
      return { animation }
    },
  })

  return () => {
    handle?.dispose()
    cleanup()
  }
}

const slicesFeature: FeatureModule = {
  name: 'slices',
  init(ctx: FeatureContext): () => void {
    bindFeature(ctx, elementMatches, setupOne)
    return () => {}
  },
}

export default slicesFeature
