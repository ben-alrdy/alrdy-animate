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
  killTweensOf: (targets: unknown, props?: string) => void
  getProperty: (target: unknown, property: string, unit?: string) => number | string
  delayedCall: (delay: number, callback: () => void, params?: unknown[], scope?: unknown) => GsapTween
  timeline: (...args: unknown[]) => GsapTimeline
  defaults: (vars?: Record<string, unknown>) => Record<string, unknown>
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
  // GSAP source: matchMedia.kill(revert) calls Context.kill(revert, true) on
  // each registered context. With no truthy `revert` arg, Context.kill skips
  // clearProps and just removes tweens/triggers — preserving inline GSAP
  // styles. The `true` second arg ensures the matchMedia listener bookkeeping
  // is cleaned up either way (no leaked media-query listeners).
  kill: () => void
}

export interface GsapTween {
  kill: () => void
  progress: {
    (): number
    (value: number): GsapTween
  }
  timeScale: {
    (): number
    (value: number): GsapTween
  }
  /** Optional `from` time / label to jump to before resuming forward. */
  play: (from?: number | string, suppressEvents?: boolean) => GsapTween
  pause: (atTime?: number | string, suppressEvents?: boolean) => GsapTween
  reverse: (from?: number | string, suppressEvents?: boolean) => GsapTween
}

export interface GsapTimeline extends GsapTween {
  to: (...args: unknown[]) => GsapTimeline
  from: (...args: unknown[]) => GsapTimeline
  fromTo: (...args: unknown[]) => GsapTimeline
  set: (...args: unknown[]) => GsapTimeline
  add: (...args: unknown[]) => GsapTimeline
  progress: {
    (): number
    (value: number): GsapTimeline
  }
  timeScale: {
    (): number
    (value: number): GsapTimeline
  }
  play: (from?: number | string, suppressEvents?: boolean) => GsapTimeline
  pause: (atTime?: number | string, suppressEvents?: boolean) => GsapTimeline
  reverse: (from?: number | string, suppressEvents?: boolean) => GsapTimeline
  /** Rewind to time 0 and play forward. */
  restart: (includeDelay?: boolean, suppressEvents?: boolean) => GsapTimeline
  /** True if the timeline has at least one active child tween right now. */
  isActive: () => boolean
  /** Set or replace a timeline lifecycle callback (`onComplete`, `onUpdate`, …). */
  eventCallback: (type: string, callback?: (() => void) | null) => GsapTimeline
}

const PLUGIN_GLOBAL_NAMES: Record<string, string> = {
  ScrollTrigger: 'ScrollTrigger',
  SplitText: 'SplitText',
  Draggable: 'Draggable',
  InertiaPlugin: 'InertiaPlugin',
  Flip: 'Flip',
  CustomEase: 'CustomEase',
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
