import type {
  ReducedMotionOptions,
  ResizeCallback,
  ResizeUnsubscribe,
  ResolvedOptions,
} from '../types/index'
import type { GsapHandle, GsapTween } from './gsap-detect'
import type { ResponsiveController } from './match-media'
import type { ResolvedPreset } from './presets'
import type { FeatureName } from './scanner'
import { readAttrs, type Config, type ResolvedAttrs } from './settings'

export interface FeatureContext {
  gsap: GsapHandle
  responsive: ResponsiveController
  elements: Element[]
  options: ResolvedOptions
  debug: boolean
  /**
   * True iff this is the *first* init() call in the page session. Reset only
   * by a hard reload — survives every destroy() / re-init cycle. Features use
   * it to decide whether `aa-trigger="load-once"` should fire (first init only)
   * or fall through to the element's other triggers.
   */
  firstInit: boolean
  /**
   * Snapshot of `(prefers-reduced-motion: reduce)` taken at init time, gated by
   * `options.reducedMotion`. `null` means "no reduced-motion fallback applies"
   * (either the user opted out via `reducedMotion: false` or the OS preference
   * is off). When non-null, appear/text/reveal features collapse to a simple
   * opacity fade with these timing values; hover and parallax skip entirely.
   */
  reducedMotion: ReducedMotionOptions | null
  /**
   * Class → animation preset resolution for this init. Elements only appear
   * here when (a) their class matched an `init({ presets })` entry and (b)
   * they have no `aa-*` attribute (the element's own attribute always wins).
   * Features pass `presetMap.get(el)` into `readAttrs()` as a fallback
   * attribute source and use `matchAnimateValue()` in their element matchers.
   */
  presetMap: Map<Element, ResolvedPreset>
  onResize: (fn: ResizeCallback, debounce?: number) => ResizeUnsubscribe
  /**
   * Register a `load` / `load-once` entrance tween to start *after* the
   * browser's first paint of the revealed (from-state) element, rather than
   * autoplaying during init(). The feature builds the tween `paused` and hands
   * it here; init() releases all registered tweens (via `restart(true)`, which
   * replays from time 0 including the full delay) one paint after the aa-ready
   * reveal. This stops a wall-clock tween from advancing during the heavy
   * post-init layout/paint block and "popping in" already mid-fade.
   * Registration is a no-op once destroy() has cancelled the gate.
   */
  deferLoadStart: (tween: GsapTween) => void
}

export interface FeatureModule {
  name: FeatureName
  init: (ctx: FeatureContext) => () => void
}

type Loader = () => Promise<{ default: FeatureModule }>

const loaders: Record<FeatureName, Loader> = {
  appear: () => import('../features/appear/index'),
  text: () => import('../features/text/index'),
  reveal: () => import('../features/appear/reveal'),
  slices: () => import('../features/appear/slices'),
  parallax: () => import('../features/parallax/index'),
  tabs: () => import('../features/tabs/index'),
  marquee: () => import('../features/marquee/index'),
  nav: () => import('../features/nav/index'),
  slider: () => import('../features/slider/index'),
  modal: () => import('../features/modal/index'),
  hover: () => import('../features/hover/index'),
  cursor: () => import('../features/cursor/index'),
  stack: () => import('../features/stack/index'),
  split: () => import('../split/index'),
}

export async function loadFeature(name: FeatureName): Promise<FeatureModule | null> {
  const loader = loaders[name]
  if (!loader) return null
  try {
    const mod = await loader()
    return mod.default
  } catch (err) {
    console.error(`[alrdy-animate] failed to load feature: ${name}`, err)
    return null
  }
}

export async function loadFeatures(names: Iterable<FeatureName>): Promise<FeatureModule[]> {
  const modules = await Promise.all([...names].map(loadFeature))
  return modules.filter((m): m is FeatureModule => m !== null)
}

/**
 * Standard feature init shape: filter `ctx.elements` to those this feature
 * owns, then bind each through `ctx.responsive` so per-breakpoint configs are
 * routed correctly and matchMedia teardown is automatic.
 *
 * It exists for the per-element appearance features (appear, text, reveal,
 * parallax) whose init bodies were byte-for-byte identical. Whole-root
 * features (tabs, slider, marquee, stack, modal) use `bindRootFeature` below.
 */
export function bindFeature(
  ctx: FeatureContext,
  matches: (el: Element, presetMap: Map<Element, ResolvedPreset>) => boolean,
  setupOne: (ctx: FeatureContext, element: Element, config: Config) => (() => void) | undefined,
): void {
  const subjects = ctx.elements.filter((el) => matches(el, ctx.presetMap))
  for (const element of subjects) {
    const attrs = readAttrs(element, ctx.presetMap.get(element))
    ctx.responsive.bind(element, attrs, ({ config }) => setupOne(ctx, element, config))
  }
}

/**
 * Whole-root feature init shape: filter `ctx.elements` to the HTMLElements
 * carrying `attr`, then bind each root through `ctx.responsive` so
 * per-breakpoint configs route correctly and matchMedia teardown is automatic.
 *
 * Mirrors `bindFeature` for the per-root features (tabs, slider, marquee,
 * stack, modal) whose init wrappers were byte-for-byte identical. Roots are
 * never preset-resolved, so attrs are read without a preset. Features needing
 * a feature-level teardown (e.g. modal's scroll-lock reset) add their own
 * `return` after calling this. `nav` keeps a bespoke init (multiple setups).
 *
 * `resolveAttrs` defaults to the root-only `readAttrs`; a feature can pass its
 * own reader to fold in attributes that live on descendants (e.g. marquee
 * merges the `aa-marquee-scroller` child's per-breakpoint buckets into the
 * root config) while keeping the shared filter + bind + teardown wiring.
 */
export function bindRootFeature(
  ctx: FeatureContext,
  attr: string,
  setupOne: (ctx: FeatureContext, root: HTMLElement, config: Config) => (() => void) | undefined,
  resolveAttrs: (root: HTMLElement) => ResolvedAttrs = readAttrs,
): void {
  const subjects = ctx.elements.filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute(attr),
  )
  for (const root of subjects) {
    const attrs = resolveAttrs(root)
    ctx.responsive.bind(root, attrs, ({ config }) => setupOne(ctx, root, config))
  }
}
