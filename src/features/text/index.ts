import type { GsapTimeline } from '../../core/gsap-detect'
import type { FeatureContext, FeatureModule } from '../../core/registry'
import { parseNum, parseScrub } from '../../core/parse'
import { resolveScrollStart } from '../../core/scroll-trigger'
import { matchAnimateValue, type ResolvedPreset } from '../../core/presets'
import { readAttrs, type Config } from '../../core/settings'
import {
  buildStagger,
  defaultStaggerFor,
  parseStaggerSpec,
  type StaggerValue,
} from '../../core/stagger'
import { setupTriggeredAnimation, type TriggerVars } from '../../core/triggered-animation'
import { resolveTriggers } from '../../core/trigger'
import { applySplit, parseSplit, type SplitMode, type SplitResult } from '../../split/runtime'

type GsapTarget = Element | Element[] | NodeList
type State = Record<string, number | string>

interface SetupParams {
  element: Element
  split: SplitResult
  distance: number
}

interface SetupResult {
  targets: GsapTarget
  fromState: State
  toState: State
  cleanup?: () => void
}

interface TextAnim {
  defaultSplit: SplitMode
  maskLines?: boolean
  /** Simple path: just animate the split parts from `buildFrom` to `to`. */
  buildFrom?: (distance: number) => State
  to?: State
  /** Complex path: wrap lines, set up custom targets/states. */
  setup?: (params: SetupParams) => SetupResult
}

const OVAL_LINE_STYLE = 'overflow: clip; display: block;'
const PERSPECTIVE_LINE_STYLE = 'transform-style: preserve-3d; display: block;'

function wrapLines(
  lines: HTMLElement[],
  className: string,
  inlineStyle: string,
  perElement?: (wrapper: HTMLElement) => void,
): HTMLElement[] {
  const wrappers: HTMLElement[] = []
  for (const line of lines) {
    const wrapper = document.createElement('div')
    wrapper.classList.add(className)
    wrapper.setAttribute('style', inlineStyle)
    if (perElement) perElement(wrapper)
    line.parentNode?.insertBefore(wrapper, line)
    wrapper.appendChild(line)
    wrappers.push(wrapper)
  }
  return wrappers
}

function unwrapLines(wrappers: HTMLElement[]): void {
  for (const w of wrappers) {
    const child = w.firstElementChild
    if (child && w.parentNode) {
      w.parentNode.insertBefore(child, w)
      w.remove()
    }
  }
}

// Direction → (axis, sign) lookup used by fade/blur/slide/tilt builders.
// `Y` maps to `yPercent`, `X` maps to `xPercent`. `sign === 1` means the
// element starts off-screen on the *opposite* axis (up → starts below).
type Direction = 'up' | 'down' | 'left' | 'right'
const DIR_AXIS: Record<Direction, { prop: 'yPercent' | 'xPercent'; sign: 1 | -1 }> = {
  up: { prop: 'yPercent', sign: 1 },
  down: { prop: 'yPercent', sign: -1 },
  left: { prop: 'xPercent', sign: 1 },
  right: { prop: 'xPercent', sign: -1 },
}

function fadeAnim(opacity: number, direction?: Direction): TextAnim {
  if (!direction) {
    return {
      defaultSplit: 'chars',
      buildFrom: () => ({ opacity }),
      to: { opacity: 1 },
    }
  }
  const { prop, sign } = DIR_AXIS[direction]
  return {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity, [prop]: 60 * sign * d }),
    to: { opacity: 1, [prop]: 0 },
  }
}

function blurAnim(direction?: Direction): TextAnim {
  if (!direction) {
    return {
      defaultSplit: 'chars',
      buildFrom: () => ({ opacity: 0, filter: 'blur(20px)' }),
      to: { opacity: 1, filter: 'blur(0px)' },
    }
  }
  const { prop, sign } = DIR_AXIS[direction]
  if (prop === 'yPercent') {
    return {
      defaultSplit: 'chars',
      maskLines: true,
      buildFrom: () => ({ opacity: 0, filter: 'blur(10px)', yPercent: 110 * sign }),
      to: { opacity: 1, filter: 'blur(0px)', yPercent: 0 },
    }
  }
  // Horizontal blur uses an absolute rem offset scaled by aa-distance instead
  // of a yPercent mask shift — the visual is a soft drift, not a clip reveal.
  return {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity: 0, filter: 'blur(10px)', x: `${1.875 * sign * d}rem` }),
    to: { opacity: 1, filter: 'blur(0px)', x: 0 },
  }
}

function scaleAnim(origin: '50% 50%' | '50% 100%' | '50% 0%'): TextAnim {
  return {
    defaultSplit: 'chars',
    buildFrom: () => ({ scaleY: 0, transformOrigin: origin }),
    to: { scaleY: 1 },
  }
}

function slideAnim(direction: 'up' | 'down'): TextAnim {
  const sign = direction === 'up' ? 1 : -1
  return {
    defaultSplit: 'lines',
    maskLines: true,
    buildFrom: () => ({ yPercent: 110 * sign }),
    to: { yPercent: 0 },
  }
}

function tiltAnim(direction: 'up' | 'down'): TextAnim {
  const sign = direction === 'up' ? 1 : -1
  return {
    defaultSplit: 'lines',
    maskLines: true,
    buildFrom: () => ({
      yPercent: 110 * sign,
      opacity: 0,
      rotation: 10 * sign,
      transformOrigin: direction === 'up' ? 'bottom left' : 'top left',
    }),
    to: { yPercent: 0, opacity: 1, rotation: 0 },
  }
}

function ovalAnim(origin: 'top' | 'bottom'): TextAnim {
  const at = origin === 'bottom' ? '50% 100%' : '50% 0%'
  return {
    defaultSplit: 'lines',
    setup: ({ split }) => {
      const wrappers = wrapLines(split.lines, 'aa-oval-line', OVAL_LINE_STYLE)
      return {
        targets: wrappers,
        fromState: { clipPath: `ellipse(20% 0% at ${at})` },
        toState: { clipPath: `ellipse(100% 120% at ${at})` },
        cleanup: () => unwrapLines(wrappers),
      }
    },
  }
}

// Per-animation entries declare only structural defaults: which split mode the
// animation expects and whether lines are masked. All timing — duration, ease,
// stagger — flows from init({...}); stagger varies per split mode via
// defaultStaggerFor().
const TEXT_ANIMS: Record<string, TextAnim> = {
  'text-fade': fadeAnim(0),
  'text-fade-30': fadeAnim(0.3),
  'text-fade-10': fadeAnim(0.1),
  'text-fade-up': fadeAnim(0, 'up'),
  'text-fade-down': fadeAnim(0, 'down'),
  'text-fade-left': fadeAnim(0, 'left'),
  'text-fade-right': fadeAnim(0, 'right'),

  'text-blur': blurAnim(),
  'text-blur-up': blurAnim('up'),
  'text-blur-down': blurAnim('down'),
  'text-blur-left': blurAnim('left'),
  'text-blur-right': blurAnim('right'),

  'text-scale': scaleAnim('50% 50%'),
  'text-scale-up': scaleAnim('50% 100%'),
  'text-scale-down': scaleAnim('50% 0%'),

  'text-slide-up': slideAnim('up'),
  'text-slide-down': slideAnim('down'),

  'text-tilt-up': tiltAnim('up'),
  'text-tilt-down': tiltAnim('down'),

  'text-oval-up': ovalAnim('bottom'),
  'text-oval-down': ovalAnim('top'),

  'text-rotate': {
    defaultSplit: 'lines',
    setup: ({ element, split }) => {
      const fontSize = parseFloat(window.getComputedStyle(element).fontSize) || 16
      const perspective = `${fontSize * 5}px`
      const wrappers = wrapLines(
        split.lines,
        'aa-perspective-line',
        PERSPECTIVE_LINE_STYLE,
        (w) => {
          w.style.perspective = perspective
        },
      )
      for (const line of split.lines) {
        line.style.transformOrigin = '50% 0%'
      }
      return {
        targets: split.lines,
        fromState: { autoAlpha: 0, rotateX: -90, yPercent: 100, scaleX: 0.75 },
        toState: { autoAlpha: 1, rotateX: 0, yPercent: 0, scaleX: 1 },
        cleanup: () => unwrapLines(wrappers),
      }
    },
  },
}

type AxisLetter = 'X' | 'Y'

interface BarDirection {
  axis: AxisLetter
  growOrigin: string
  shrinkOrigin: string
  textAxis: 'x' | 'y'
  textOffset: string
}

// Direction names match v7: the named edge is where the bar exits to, so
// "right" sweeps left → right, "up" sweeps bottom → top, etc.
const BAR_DIRECTIONS: Record<string, BarDirection> = {
  right: {
    axis: 'X',
    growOrigin: 'left center',
    shrinkOrigin: 'right center',
    textAxis: 'x',
    textOffset: '-0.6em',
  },
  left: {
    axis: 'X',
    growOrigin: 'right center',
    shrinkOrigin: 'left center',
    textAxis: 'x',
    textOffset: '0.6em',
  },
  up: {
    axis: 'Y',
    growOrigin: 'bottom center',
    shrinkOrigin: 'top center',
    textAxis: 'y',
    textOffset: '0.6em',
  },
  down: {
    axis: 'Y',
    growOrigin: 'top center',
    shrinkOrigin: 'bottom center',
    textAxis: 'y',
    textOffset: '-0.6em',
  },
}

const BAR_NAMES = new Set<string>()
for (const dirName of Object.keys(BAR_DIRECTIONS)) {
  BAR_NAMES.add(`text-block-${dirName}`)
  BAR_NAMES.add(`text-marker-${dirName}`)
}

function parseBarName(name: string): { mode: 'block' | 'marker'; dir: BarDirection } | null {
  const m = name.match(/^text-(block|marker)-(up|down|left|right)$/)
  if (!m) return null
  return { mode: m[1] as 'block' | 'marker', dir: BAR_DIRECTIONS[m[2]] }
}

function resolveBarColor(value: string | undefined, element: Element): string {
  if (!value) return 'currentColor'
  const trimmed = value.trim()
  if (trimmed.startsWith('--')) {
    const resolved = window.getComputedStyle(element).getPropertyValue(trimmed).trim()
    return resolved || trimmed
  }
  return trimmed
}

interface BarLineSetup {
  bar: HTMLElement
  text: HTMLElement | null
}

function buildBarLines(
  lines: HTMLElement[],
  color: string,
  withTextWrapper: boolean,
): BarLineSetup[] {
  const setups: BarLineSetup[] = []
  for (const line of lines) {
    // Negative margin tightens line spacing so adjacent bars touch when
    // line-height is around 1.0; the matching negative inset on the bar
    // extends it slightly above/below the text bounds.
    line.style.display = 'inline-block'
    line.style.position = 'relative'
    line.style.margin = '-0.055em 0'

    let text: HTMLElement | null = null
    if (withTextWrapper) {
      text = document.createElement('span')
      text.className = 'aa-block-text'
      text.style.display = 'inline-block'
      text.style.willChange = 'transform, opacity'
      while (line.firstChild) text.appendChild(line.firstChild)
      line.appendChild(text)
    }

    const bar = document.createElement('div')
    bar.className = 'aa-bar'
    bar.style.cssText =
      'position:absolute;inset:-0.055em 0;pointer-events:none;z-index:1;will-change:transform;'
    bar.style.backgroundColor = color
    line.appendChild(bar)

    setups.push({ bar, text })
  }
  return setups
}

const SUPPORTED = new Set([...Object.keys(TEXT_ANIMS), ...BAR_NAMES])

function elementMatches(el: Element, presetMap: Map<Element, ResolvedPreset>): boolean {
  return matchAnimateValue(el, presetMap, (v) => SUPPORTED.has(v))
}

function pickSimpleTargets(
  parts: { words: HTMLElement[]; chars: HTMLElement[]; lines: HTMLElement[] },
  mode: SplitMode,
): HTMLElement[] {
  if (mode === 'chars') return parts.chars
  if (mode === 'lines') return parts.lines
  return parts.words
}

function setupBarReveal(
  ctx: FeatureContext,
  element: Element,
  config: Config,
  parsed: { mode: 'block' | 'marker'; dir: BarDirection },
): (() => void) | undefined {
  const { mode, dir } = parsed
  const isBlock = mode === 'block'
  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration)
  const delay = parseNum(config['aa-delay'], 0)
  const ease = config['aa-ease'] ?? opts.ease
  const { unit: stagger } = parseStaggerSpec(config['aa-stagger'], defaultStaggerFor('lines', opts))
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd
  const scrub = parseScrub(config['aa-scrub'])
  const scrollStart = resolveScrollStart(config['aa-scroll-start'], opts, scrub)
  const again = opts.again !== false

  const scaleProp = `scale${dir.axis}`

  // Build the per-line phased timeline from the current bar/text setups.
  // Two-phase for block mode (grow-in, then shrink-out + text fade-in);
  // single-phase for marker (shrink-out reveals text underneath).
  const buildTimelineFromSetups = (
    setups: BarLineSetup[],
    vars: TriggerVars,
  ): GsapTimeline => {
    const tl = ctx.gsap.gsap.timeline(vars)
    setups.forEach(({ bar, text }, i) => {
      const lineTl = ctx.gsap.gsap.timeline()
      if (isBlock) {
        const revealDur = duration * 0.4
        const shrinkDur = duration * 0.6
        const textDur = duration * 0.4
        // Phase 1: bar grows in from the entry edge.
        lineTl.fromTo(
          bar,
          { [scaleProp]: 0, transformOrigin: dir.growOrigin },
          { [scaleProp]: 1, duration: revealDur, ease },
        )
        // Flip the origin between phases. Using `.set()` here (rather than
        // a second fromTo) is the only pattern that survives the
        // `tl.progress(0).pause()` reset used by the again-trigger:
        // transformOrigin is non-tweenable, so a fromTo's from-state isn't
        // restored on rewind, leaving the origin stuck at `growOrigin` for
        // phase 2 of every subsequent play.
        lineTl.set(bar, { transformOrigin: dir.shrinkOrigin })
        // Phase 2: shrink toward the exit edge from the current scale.
        lineTl.to(bar, { [scaleProp]: 0, duration: shrinkDur, ease })
        if (text) {
          // Anchor to the start of phase 2 (one tween + one set back from here).
          lineTl.fromTo(
            text,
            { opacity: 0, [dir.textAxis]: dir.textOffset },
            { opacity: 1, [dir.textAxis]: 0, duration: textDur, ease },
            `<`,
          )
        }
      } else {
        lineTl.fromTo(
          bar,
          { [scaleProp]: 1, transformOrigin: dir.shrinkOrigin },
          { [scaleProp]: 0, duration, ease },
        )
      }
      tl.add(lineTl, i * stagger)
    })
    return tl
  }

  // Tracks the per-split bar/text wrappers so the buildAnimation callback
  // (called once initially, then on every SplitText resplit) sees the
  // latest DOM. Each rebuild also re-applies the initial state explicitly
  // so the staggered timeline shows correct positions at time 0.
  let setups: BarLineSetup[] = []

  let split: SplitResult | undefined

  const initialSplit = applySplit(element, 'lines', ctx.gsap, {
    onResplit: (newSplit) => {
      split = newSplit
      handle?.rebuild()
    },
  })
  if (initialSplit.lines.length === 0) {
    initialSplit.revert()
    return undefined
  }
  split = initialSplit

  const handle = setupTriggeredAnimation(ctx, element, {
    triggers: resolveTriggers(element, config['aa-trigger']),
    delay,
    scrollStart,
    scrollEnd,
    scrub,
    again,
    buildAnimation: (vars) => {
      if (!split || split.lines.length === 0) return null
      const color = resolveBarColor(element.getAttribute('aa-color') ?? undefined, element)
      setups = buildBarLines(split.lines, color, isBlock)
      // Lock initial states explicitly so the element looks correct at
      // time 0 regardless of when each per-line tween starts.
      for (const { bar, text } of setups) {
        ctx.gsap.gsap.set(bar, {
          [scaleProp]: isBlock ? 0 : 1,
          transformOrigin: isBlock ? dir.growOrigin : dir.shrinkOrigin,
        })
        if (text) {
          ctx.gsap.gsap.set(text, { opacity: 0, [dir.textAxis]: dir.textOffset })
        }
      }
      const animation = buildTimelineFromSetups(setups, vars)
      return { animation }
    },
  })

  return () => {
    handle?.dispose()
    initialSplit.revert()
  }
}

function setupOne(
  ctx: FeatureContext,
  element: Element,
  config: Config,
): (() => void) | undefined {
  const animate = config['aa-animate']
  if (!animate || !SUPPORTED.has(animate)) return undefined
  const bar = parseBarName(animate)
  if (bar) return setupBarReveal(ctx, element, config, bar)
  const anim = TEXT_ANIMS[animate]

  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration)
  const delay = parseNum(config['aa-delay'], 0)
  const ease = config['aa-ease'] ?? opts.ease
  const distance = parseNum(config['aa-distance'], opts.distance)
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd
  const scrub = parseScrub(config['aa-scrub'])
  const scrollStart = resolveScrollStart(config['aa-scroll-start'], opts, scrub)
  const again = opts.again !== false

  const userSplit = parseSplit(config['aa-split'])
  const splitMode = userSplit?.mode ?? anim.defaultSplit
  const staggerSpec = parseStaggerSpec(config['aa-stagger'], defaultStaggerFor(splitMode, opts))
  const stagger: StaggerValue = buildStagger(staggerSpec.unit, staggerSpec.flags)
  const lineStagger = staggerSpec.line
  const lineGrouped = userSplit?.groupBy === 'lines' && !anim.setup
  const maskGranularity: SplitMode | undefined = userSplit?.mask
    ? userSplit.groupBy === 'lines'
      ? 'lines'
      : splitMode
    : anim.maskLines
      ? 'lines'
      : undefined

  // Tracks the current split — reassigned on each SplitText auto-resplit
  // (resize within a breakpoint changes line wrapping) so the buildAnimation
  // callback below always reads the live `.aa-char` / `.aa-line` DOM.
  let split: SplitResult | undefined

  const initialSplit = applySplit(element, splitMode, ctx.gsap, {
    ...(maskGranularity ? { mask: maskGranularity } : {}),
    ...(lineGrouped ? { ensureLines: true } : {}),
    onResplit: (newSplit) => {
      split = newSplit
      handle?.rebuild()
    },
  })
  split = initialSplit

  const handle = setupTriggeredAnimation(ctx, element, {
    triggers: resolveTriggers(element, config['aa-trigger']),
    delay,
    scrollStart,
    scrollEnd,
    scrub,
    again,
    buildAnimation: (vars) => {
      if (!split) return null
      let targets: GsapTarget
      let fromState: State
      let toState: State
      let extraCleanup: (() => void) | undefined
      let lineGroups: HTMLElement[][] | undefined
      if (anim.setup) {
        // anim.setup paths (oval, rotate) wrap lines in extra DOM and
        // return a cleanup that unwraps them. The orchestrator runs this
        // cleanup before the next rebuild and on dispose.
        const result = anim.setup({ element, split, distance })
        targets = result.targets
        fromState = result.fromState
        toState = result.toState
        if (result.cleanup) extraCleanup = result.cleanup
      } else {
        if (!anim.buildFrom || !anim.to) return null
        const simple = pickSimpleTargets(split, splitMode)
        if (simple.length === 0) return null
        targets = simple
        fromState = anim.buildFrom(distance)
        toState = anim.to
        if (lineGrouped) {
          const inner = splitMode === 'words' ? split.words : split.chars
          lineGroups = split.lines.map((line) => inner.filter((u) => line.contains(u)))
        }
      }
      const tl = ctx.gsap.gsap.timeline(vars)
      // Lock the resting state explicitly so a paused-at-0 timeline shows
      // the from-state visually, not whatever GSAP computes from a stale
      // layout. Redundant for unpaused load tweens but harmless.
      ctx.gsap.gsap.set(targets, fromState)
      if (lineGroups) {
        for (let i = 0; i < lineGroups.length; i++) {
          const group = lineGroups[i]
          if (group.length === 0) continue
          tl.fromTo(group, fromState, { ...toState, duration, ease, stagger }, i * lineStagger)
        }
      } else {
        tl.fromTo(targets, fromState, { ...toState, duration, ease, stagger })
      }
      const built: { animation: GsapTimeline; cleanup?: () => void } = { animation: tl }
      if (extraCleanup) built.cleanup = extraCleanup
      return built
    },
  })

  return () => {
    handle?.dispose()
    initialSplit.revert()
  }
}

const textFeature: FeatureModule = {
  name: 'text',
  requiredPlugins: ['ScrollTrigger', 'SplitText'],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter((el) => elementMatches(el, ctx.presetMap))
    for (const element of subjects) {
      const attrs = readAttrs(element, ctx.presetMap.get(element))
      ctx.responsive.bind(element, attrs, ({ config }) => setupOne(ctx, element, config))
    }
    return () => {}
  },
}

export default textFeature
