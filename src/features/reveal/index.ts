import { bindFeature, type FeatureContext, type FeatureModule } from '../../core/registry'
import { parseNum, readAnimationConfig } from '../../core/parse'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import type { Config } from '../../core/settings'
import { defaultStaggerFor } from '../../core/stagger'
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

interface SlicesParams {
  mode: 'reveal' | 'cover'
  rows: number
}

/**
 * `aa-animate` packs the slice mode and count into the value itself, e.g.
 *   reveal-slices              → reveal mode, 6 rows (defaults)
 *   reveal-slices-12           → reveal mode, 12 rows
 *   reveal-slices-cover        → cover mode, 6 rows
 *   reveal-slices-cover-8      → cover mode, 8 rows
 * Any unknown trailing token is ignored.
 */
function parseSlicesValue(name: string): SlicesParams | null {
  if (name !== 'reveal-slices' && !name.startsWith('reveal-slices-')) return null
  const rest = name.slice('reveal-slices'.length).replace(/^-/, '')
  let mode: 'reveal' | 'cover' = 'reveal'
  let rows = 6
  if (rest.length > 0) {
    for (const token of rest.split('-')) {
      if (token === 'cover' || token === 'reveal') mode = token
      else {
        const n = parseInt(token, 10)
        if (Number.isFinite(n) && n > 0) rows = n
      }
    }
  }
  return { mode, rows }
}

function isSupported(name: string): boolean {
  return CLIP_VARIANTS.has(name) || parseSlicesValue(name) !== null
}

function elementMatches(el: Element, presetMap: Map<Element, ResolvedPreset>): boolean {
  return matchAnimateValue(el, presetMap, isSupported)
}

function setupClip(
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

interface SlicesSetup {
  panel: HTMLElement
  slices: HTMLElement[]
  prevPosition?: string
  prevOverflow?: string
}

function buildSlicesPanel(element: HTMLElement, rows: number): SlicesSetup {
  const cs = window.getComputedStyle(element)
  const prevPosition = cs.position === 'static' ? '' : cs.position
  const prevOverflow = cs.overflow

  if (cs.position === 'static') {
    element.style.position = 'relative'
  }
  if (cs.overflow === 'visible') {
    element.style.overflow = 'hidden'
  }

  const panel = document.createElement('div')
  panel.className = 'aa-slices-panel'
  panel.setAttribute(
    'style',
    'position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none;z-index:2',
  )

  const slices: HTMLElement[] = []
  const fragment = document.createDocumentFragment()
  for (let i = 0; i < rows; i++) {
    const slice = document.createElement('div')
    slice.className = 'aa-slice'
    slice.setAttribute(
      'style',
      'flex:1 1 auto;background:currentColor;will-change:transform;backface-visibility:hidden',
    )
    fragment.appendChild(slice)
    slices.push(slice)
  }
  panel.appendChild(fragment)
  element.appendChild(panel)

  return { panel, slices, prevPosition, prevOverflow }
}

function setupSlices(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate) return undefined
  const params = parseSlicesValue(animate)
  if (!params) return undefined

  const opts = ctx.options
  const { mode, rows } = params
  const { duration, ease, scrollStart, scrollEnd, scrub, again } =
    readAnimationConfig(config, opts)
  const stagger = parseNum(config['aa-stagger'], defaultStaggerFor(undefined, opts))

  // Reveal: slices start covering (scaleY=1) and animate to scaleY=0,
  // origin at top so they vanish upward.
  // Cover: slices start hidden (scaleY=0) and grow to scaleY=1,
  // origin at bottom so they fill upward — natural for section transitions.
  const fromScale = mode === 'cover' ? 0 : 1
  const toScale = mode === 'cover' ? 1 : 0
  const origin = mode === 'cover' ? 'bottom center' : 'top center'

  const setup = buildSlicesPanel(element as HTMLElement, rows)
  ctx.gsap.gsap.set(setup.slices, { scaleY: fromScale, transformOrigin: origin })

  const cleanup = (): void => {
    ctx.gsap.gsap.killTweensOf(setup.slices)
    setup.panel.remove()
    const el = element as HTMLElement
    if (setup.prevPosition === '') el.style.removeProperty('position')
    if (setup.prevOverflow === 'visible') el.style.removeProperty('overflow')
  }

  const handle = setupTriggeredAnimation(ctx, element, {
    triggers: resolveTriggers(element, config['aa-trigger']),
    delay: 0,
    scrollStart,
    scrollEnd,
    scrub,
    again,
    buildAnimation: (vars) => {
      const animation = ctx.gsap.gsap.to(setup.slices, {
        scaleY: toScale,
        duration,
        ease,
        stagger: { each: stagger, from: 'end' },
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

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate) return undefined
  if (parseSlicesValue(animate) !== null) return setupSlices(ctx, element, config)
  return setupClip(ctx, element, config)
}

const revealFeature: FeatureModule = {
  name: 'reveal',
  init(ctx: FeatureContext): () => void {
    bindFeature(ctx, elementMatches, setupOne)
    return () => {}
  },
}

export default revealFeature
