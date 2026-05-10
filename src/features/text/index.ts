import type { GsapTimeline } from '../../core/gsap-detect'
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
  resolveTriggers,
  subscribeWithPair,
} from '../../core/trigger'
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

// Per-animation entries declare only structural defaults: which split mode the
// animation expects and whether lines are masked. All timing — duration, ease,
// stagger — flows from init({...}); stagger varies per split mode via
// defaultStaggerFor().
const TEXT_ANIMS: Record<string, TextAnim> = {
  // ---------- Fade ----------
  'text-fade': {
    defaultSplit: 'chars',
    buildFrom: () => ({ opacity: 0 }),
    to: { opacity: 1 },
  },
  'text-fade-30': {
    defaultSplit: 'chars',
    buildFrom: () => ({ opacity: 0.3 }),
    to: { opacity: 1 },
  },
  'text-fade-10': {
    defaultSplit: 'chars',
    buildFrom: () => ({ opacity: 0.1 }),
    to: { opacity: 1 },
  },
  'text-fade-up': {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity: 0, yPercent: 60 * d }),
    to: { opacity: 1, yPercent: 0 },
  },
  'text-fade-down': {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity: 0, yPercent: -60 * d }),
    to: { opacity: 1, yPercent: 0 },
  },
  'text-fade-left': {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity: 0, xPercent: 60 * d }),
    to: { opacity: 1, xPercent: 0 },
  },
  'text-fade-right': {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity: 0, xPercent: -60 * d }),
    to: { opacity: 1, xPercent: 0 },
  },

  // ---------- Blur ----------
  'text-blur': {
    defaultSplit: 'chars',
    buildFrom: () => ({ opacity: 0, filter: 'blur(20px)' }),
    to: { opacity: 1, filter: 'blur(0px)' },
  },
  'text-blur-up': {
    defaultSplit: 'chars',
    maskLines: true,
    buildFrom: () => ({ opacity: 0, filter: 'blur(10px)', yPercent: 110 }),
    to: { opacity: 1, filter: 'blur(0px)', yPercent: 0 },
  },
  'text-blur-down': {
    defaultSplit: 'chars',
    maskLines: true,
    buildFrom: () => ({ opacity: 0, filter: 'blur(10px)', yPercent: -110 }),
    to: { opacity: 1, filter: 'blur(0px)', yPercent: 0 },
  },
  'text-blur-left': {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity: 0, filter: 'blur(10px)', x: `${1.875 * d}rem` }),
    to: { opacity: 1, filter: 'blur(0px)', x: 0 },
  },
  'text-blur-right': {
    defaultSplit: 'chars',
    buildFrom: (d) => ({ opacity: 0, filter: 'blur(10px)', x: `${-1.875 * d}rem` }),
    to: { opacity: 1, filter: 'blur(0px)', x: 0 },
  },

  // ---------- Slide ----------
  'text-slide-up': {
    defaultSplit: 'lines',
    maskLines: true,
    buildFrom: () => ({ yPercent: 110 }),
    to: { yPercent: 0 },
  },
  'text-slide-down': {
    defaultSplit: 'lines',
    maskLines: true,
    buildFrom: () => ({ yPercent: -110 }),
    to: { yPercent: 0 },
  },

  // ---------- Tilt ----------
  'text-tilt-up': {
    defaultSplit: 'lines',
    maskLines: true,
    buildFrom: () => ({
      yPercent: 110,
      opacity: 0,
      rotation: 10,
      transformOrigin: 'bottom left',
    }),
    to: { yPercent: 0, opacity: 1, rotation: 0 },
  },
  'text-tilt-down': {
    defaultSplit: 'lines',
    maskLines: true,
    buildFrom: () => ({
      yPercent: -110,
      opacity: 0,
      rotation: -10,
      transformOrigin: 'top left',
    }),
    to: { yPercent: 0, opacity: 1, rotation: 0 },
  },

  // ---------- Per-line clip / perspective wrappers ----------
  'text-oval-up': {
    defaultSplit: 'lines',
    setup: ({ split }) => {
      const wrappers = wrapLines(split.lines, 'aa-oval-line', OVAL_LINE_STYLE)
      return {
        targets: wrappers,
        fromState: { clipPath: 'ellipse(20% 0% at 50% 100%)' },
        toState: { clipPath: 'ellipse(100% 120% at 50% 100%)' },
        cleanup: () => unwrapLines(wrappers),
      }
    },
  },
  'text-oval-down': {
    defaultSplit: 'lines',
    setup: ({ split }) => {
      const wrappers = wrapLines(split.lines, 'aa-oval-line', OVAL_LINE_STYLE)
      return {
        targets: wrappers,
        fromState: { clipPath: 'ellipse(20% 0% at 50% 0%)' },
        toState: { clipPath: 'ellipse(100% 120% at 50% 0%)' },
        cleanup: () => unwrapLines(wrappers),
      }
    },
  },
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

function parseScrub(value: string | undefined): number | true | undefined {
  if (value === undefined) return undefined
  if (value === '' || value === 'true') return true
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : true
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
  const scrollStart = config['aa-scroll-start'] ?? opts.scrollStart
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd
  const scrub = parseScrub(config['aa-scrub'])
  const again = opts.again !== false

  const split = applySplit(element, 'lines', ctx.gsap)
  if (split.lines.length === 0) {
    split.revert()
    return undefined
  }

  const color = resolveBarColor(element.getAttribute('aa-color') ?? undefined, element)
  const setups = buildBarLines(split.lines, color, isBlock)

  const scaleProp = `scale${dir.axis}`

  // Lock initial states explicitly so the element looks correct at time 0
  // regardless of when each per-line tween starts in the staggered timeline.
  for (const { bar, text } of setups) {
    ctx.gsap.gsap.set(bar, {
      [scaleProp]: isBlock ? 0 : 1,
      transformOrigin: isBlock ? dir.growOrigin : dir.shrinkOrigin,
    })
    if (text) {
      ctx.gsap.gsap.set(text, { opacity: 0, [dir.textAxis]: dir.textOffset })
    }
  }

  const buildTl = (vars: Record<string, unknown>): GsapTimeline => {
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

  const cleanup = (): void => {
    split.revert()
  }

  const triggers = resolveTriggers(element, config['aa-trigger'])
  const hasLoad = triggers.some((t) => t.kind === 'load')

  if (hasLoad && ctx.firstInit) {
    // aa-fallback signals the inline-snippet timeout already faded the element
    // in via CSS; skip the JS animation to avoid a re-flash through from-state.
    if (document.documentElement.hasAttribute('aa-fallback')) return cleanup
    buildTl({ delay })
    return cleanup
  }

  // Load-only on subsequent init: skip entirely (no scroll fallthrough). The
  // end-of-init aa-ready flip makes the element visible in its natural state.
  const trigger = triggers.find((t) => t.kind !== 'load')
  if (!trigger) return cleanup

  if (trigger.kind === 'event' && trigger.eventName) {
    const tl = buildTl({ paused: true, delay, defaults: { easeReverse: REVERSE_EASE } })
    const off = subscribeWithPair({
      element,
      forwardName: trigger.eventName,
      onForward: () => {
        // Always restart from the FROM state so an interrupted reverse doesn't
        // leak into the next play. Matches the user-facing "fresh start"
        // expectation when reopening a tab / reactivating a slide. Reset
        // timeScale to 1 in case a prior reverse left it accelerated.
        tl.timeScale(1).play(0)
      },
      onReverse: () => {
        tl.timeScale(REVERSE_TIME_SCALE).reverse()
      },
    })
    return () => {
      off()
      cleanup()
    }
  }

  if (scrub !== undefined) {
    buildTl({
      delay,
      scrollTrigger: {
        trigger: element,
        start: scrollStart,
        end: scrollEnd,
        scrub,
      },
    })
    return cleanup
  }

  const tl = buildTl({ paused: true, delay })

  bindAgainTrigger({
    gsap: ctx.gsap,
    trigger: element,
    start: scrollStart,
    again,
    onPlay: () => tl.play(),
    onReset: () => {
      tl.progress(0).pause()
    },
  })

  return cleanup
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
  const scrollStart = config['aa-scroll-start'] ?? opts.scrollStart
  const scrollEnd = config['aa-scroll-end'] ?? opts.scrollEnd
  const scrub = parseScrub(config['aa-scrub'])
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
  const split = applySplit(element, splitMode, ctx.gsap, {
    ...(maskGranularity ? { mask: maskGranularity } : {}),
    ...(lineGrouped ? { ensureLines: true } : {}),
  })

  let targets: GsapTarget
  let fromState: State
  let toState: State
  let extraCleanup: (() => void) | undefined
  let lineGroups: HTMLElement[][] | undefined

  if (anim.setup) {
    const result = anim.setup({ element, split, distance })
    targets = result.targets
    fromState = result.fromState
    toState = result.toState
    extraCleanup = result.cleanup
  } else {
    if (!anim.buildFrom || !anim.to) {
      split.revert()
      return undefined
    }
    targets = pickSimpleTargets(split, splitMode)
    if ((targets as HTMLElement[]).length === 0) {
      return () => split.revert()
    }
    fromState = anim.buildFrom(distance)
    toState = anim.to
    if (lineGrouped) {
      const inner = splitMode === 'words' ? split.words : split.chars
      lineGroups = split.lines.map((line) => inner.filter((u) => line.contains(u)))
    }
  }

  const cleanup = (): void => {
    if (extraCleanup) {
      try {
        extraCleanup()
      } catch {
        // ignore
      }
    }
    split.revert()
  }

  const addTweens = (timeline: GsapTimeline): void => {
    if (lineGroups) {
      for (let i = 0; i < lineGroups.length; i++) {
        const group = lineGroups[i]
        if (group.length === 0) continue
        timeline.fromTo(
          group,
          fromState,
          { ...toState, duration, ease, stagger },
          i * lineStagger,
        )
      }
    } else {
      timeline.fromTo(targets, fromState, { ...toState, duration, ease, stagger })
    }
  }

  const triggers = resolveTriggers(element, config['aa-trigger'])
  const hasLoad = triggers.some((t) => t.kind === 'load')

  if (hasLoad && ctx.firstInit) {
    // aa-fallback signals the inline-snippet timeout already faded the element
    // in via CSS; skip the JS animation to avoid a re-flash through from-state.
    if (document.documentElement.hasAttribute('aa-fallback')) return cleanup
    const loadTl = ctx.gsap.gsap.timeline({ delay })
    addTweens(loadTl)
    return cleanup
  }

  // Load-only on subsequent init: skip entirely (no scroll fallthrough). The
  // end-of-init aa-ready flip makes the element visible in its natural state.
  const trigger = triggers.find((t) => t.kind !== 'load')
  if (!trigger) return cleanup

  if (trigger.kind === 'event' && trigger.eventName) {
    const tl = ctx.gsap.gsap.timeline({
      paused: true,
      delay,
      defaults: { easeReverse: REVERSE_EASE },
    })
    addTweens(tl)
    // Lock the resting state explicitly so the paused-at-0 timeline shows the
    // from-state visually, not whatever GSAP would compute from a stale layout.
    ctx.gsap.gsap.set(targets, fromState)
    const off = subscribeWithPair({
      element,
      forwardName: trigger.eventName,
      onForward: () => {
        // Always restart from the FROM state so an interrupted reverse doesn't
        // leak into the next play. Matches the user-facing "fresh start"
        // expectation when reopening a tab / reactivating a slide. Reset
        // timeScale to 1 in case a prior reverse left it accelerated.
        tl.timeScale(1).play(0)
      },
      onReverse: () => {
        tl.timeScale(REVERSE_TIME_SCALE).reverse()
      },
    })
    return () => {
      off()
      cleanup()
    }
  }

  if (scrub !== undefined) {
    const scrubTl = ctx.gsap.gsap.timeline({
      delay,
      scrollTrigger: {
        trigger: element,
        start: scrollStart,
        end: scrollEnd,
        scrub,
      },
    })
    addTweens(scrubTl)
    return cleanup
  }

  const tl = ctx.gsap.gsap.timeline({ paused: true, delay })
  addTweens(tl)

  bindAgainTrigger({
    gsap: ctx.gsap,
    trigger: element,
    start: scrollStart,
    again,
    onPlay: () => tl.play(),
    onReset: () => {
      tl.progress(0).pause()
    },
  })

  return cleanup
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
