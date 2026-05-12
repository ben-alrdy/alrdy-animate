import type {
  ReducedMotionOptions,
  ResizeCallback,
  ResizeUnsubscribe,
  ResolvedOptions,
} from '../types/index'
import type { GsapHandle } from './gsap-detect'
import type { ResponsiveController } from './match-media'
import type { ResolvedPreset } from './presets'
import type { FeatureName } from './scanner'

export interface FeatureContext {
  gsap: GsapHandle
  responsive: ResponsiveController
  elements: Element[]
  options: ResolvedOptions
  debug: boolean
  /**
   * True iff this is the *first* init() call in the page session. Reset only
   * by a hard reload — survives every destroy() / re-init cycle. Features use
   * it to decide whether `aa-trigger="load"` should fire (first init only) or
   * fall through to the element's other triggers.
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
}

export interface FeatureModule {
  name: FeatureName
  requiredPlugins: string[]
  init: (ctx: FeatureContext) => () => void
}

type Loader = () => Promise<{ default: FeatureModule }>

const loaders: Record<FeatureName, Loader> = {
  scroll: () => import('../features/scroll/index'),
  text: () => import('../features/text/index'),
  reveal: () => import('../features/reveal/index'),
  parallax: () => import('../features/parallax/index'),
  tabs: () => import('../features/tabs/index'),
  marquee: () => import('../features/marquee/index'),
  nav: () => import('../features/nav/index'),
  slider: () => import('../features/slider/index'),
  modal: () => import('../features/modal/index'),
  hover: () => import('../features/hover/index'),
  cursor: () => import('../features/cursor/index'),
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
