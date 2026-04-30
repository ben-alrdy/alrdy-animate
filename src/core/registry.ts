import type { InitOptions } from '../types/index'
import type { GsapHandle } from './gsap-detect'
import type { ResponsiveController } from './match-media'
import type { FeatureName } from './scanner'

export interface FeatureContext {
  gsap: GsapHandle
  responsive: ResponsiveController
  elements: Element[]
  options: InitOptions
  debug: boolean
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
  hover: () => import('../features/hover/index'),
  accordion: () => import('../features/accordion/index'),
  marquee: () => import('../features/marquee/index'),
  nav: () => import('../features/nav/index'),
  slider: () => import('../features/slider/index'),
  modal: () => import('../features/modal/index'),
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
