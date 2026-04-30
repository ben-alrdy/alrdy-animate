export interface GsapHandle {
  gsap: GsapInstance
  plugins: Record<string, unknown>
  has: (pluginName: string) => boolean
}

export interface GsapInstance {
  registerPlugin: (...plugins: unknown[]) => void
  matchMedia: (scope?: Element | string) => GsapMatchMedia
  context: (fn: (ctx: GsapContext) => void, scope?: Element | string | null) => GsapContext
  to: (...args: unknown[]) => GsapTween
  from: (...args: unknown[]) => GsapTween
  fromTo: (...args: unknown[]) => GsapTween
  set: (...args: unknown[]) => GsapTween
  timeline: (...args: unknown[]) => GsapTimeline
  ticker: {
    add: (fn: (time: number) => void) => void
    remove: (fn: (time: number) => void) => void
    lagSmoothing: (threshold?: number, adjustedLag?: number) => void
  }
  utils: Record<string, unknown>
}

export interface GsapContext {
  add: (key: string | (() => void), fn?: () => void) => void
  revert: () => void
  kill: () => void
}

export interface GsapMatchMedia {
  add: (query: string | Record<string, string>, handler: (ctx: GsapContext) => void | (() => void)) => GsapMatchMedia
  revert: () => void
}

export interface GsapTween {
  kill: () => void
  progress: (value?: number) => number | GsapTween
}

export interface GsapTimeline extends GsapTween {
  to: (...args: unknown[]) => GsapTimeline
  from: (...args: unknown[]) => GsapTimeline
  fromTo: (...args: unknown[]) => GsapTimeline
  add: (...args: unknown[]) => GsapTimeline
}

const PLUGIN_GLOBAL_NAMES: Record<string, string> = {
  ScrollTrigger: 'ScrollTrigger',
  SplitText: 'SplitText',
  Draggable: 'Draggable',
  InertiaPlugin: 'InertiaPlugin',
  Flip: 'Flip',
}

export function detectGsap(
  requiredPlugins: string[] = [],
  debug = false,
): GsapHandle | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  const gsap = w.gsap as GsapInstance | undefined
  if (!gsap || typeof gsap.registerPlugin !== 'function') {
    if (debug) {
      console.warn(
        '[alrdy-animate] window.gsap not found. Add a <script> tag for GSAP before alrdy-animate.',
      )
    }
    return null
  }
  const plugins: Record<string, unknown> = {}
  const missing: string[] = []
  for (const name of requiredPlugins) {
    const globalName = PLUGIN_GLOBAL_NAMES[name] ?? name
    const plugin = w[globalName]
    if (plugin) {
      plugins[name] = plugin
      try {
        gsap.registerPlugin(plugin)
      } catch {
        // already registered; ignore
      }
    } else {
      missing.push(name)
    }
  }
  if (missing.length > 0 && debug) {
    console.warn(
      `[alrdy-animate] Missing GSAP plugins: ${missing.join(', ')}. Add the corresponding <script> tags before alrdy-animate.`,
    )
  }
  return {
    gsap,
    plugins,
    has: (n: string) => n in plugins,
  }
}
