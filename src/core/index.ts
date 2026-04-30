import '../css/alrdy-animate.css'
import type {
  InitOptions,
  OnResizeOptions,
  PublicApi,
  ResizeCallback,
  ResizeUnsubscribe,
} from '../types/index'
import { detectGsap, type GsapHandle } from './gsap-detect'
import { createResponsiveController, type ResponsiveController } from './match-media'
import { loadFeatures, type FeatureContext } from './registry'
import { clearAll as clearResize, subscribe as subscribeResize } from './resize'
import { scan } from './scanner'
import { addDisposer, resolveBreakpoints, runAllDisposers, state } from './state'

let activeHandles: { gsap: GsapHandle; responsive: ResponsiveController } | null = null

export async function init(options: InitOptions = {}): Promise<void> {
  if (state.initialized) return
  state.options = options
  state.breakpoints = resolveBreakpoints(options.breakpoints)
  state.initialized = true

  const debug = options.debug ?? false
  const { elements, features } = scan(document)
  if (elements.length === 0) return

  const requiredPlugins = new Set<string>()
  for (const f of features) {
    if (f === 'scroll' || f === 'text' || f === 'appear' || f === 'parallax' || f === 'nav') {
      requiredPlugins.add('ScrollTrigger')
    }
    if (f === 'text' || f === 'split') requiredPlugins.add('SplitText')
    if (f === 'slider') {
      requiredPlugins.add('Draggable')
      requiredPlugins.add('InertiaPlugin')
    }
    if (f === 'nav') requiredPlugins.add('Flip')
  }

  const gsapHandle = detectGsap([...requiredPlugins], debug)
  if (!gsapHandle) return

  const responsive = createResponsiveController(gsapHandle, state.breakpoints)
  activeHandles = { gsap: gsapHandle, responsive }

  const featureModules = await loadFeatures(features)
  const featureCtx: FeatureContext = {
    gsap: gsapHandle,
    responsive,
    elements,
    options,
    debug,
  }
  for (const mod of featureModules) {
    try {
      const dispose = mod.init(featureCtx)
      addDisposer(dispose)
    } catch (err) {
      console.error(`[alrdy-animate] feature "${mod.name}" failed to init`, err)
    }
  }

  if (debug) {
    console.log(
      `[alrdy-animate] initialized. Features: ${[...features].join(', ') || '(none)'}; ` +
        `Plugins: ${[...requiredPlugins].join(', ') || '(none)'}; ` +
        `Elements: ${elements.length}`,
    )
  }
}

export function destroy(): void {
  if (activeHandles?.responsive) {
    try {
      activeHandles.responsive.revertAll()
    } catch (err) {
      console.error('[alrdy-animate] responsive controller revert threw', err)
    }
  }
  runAllDisposers()
  clearResize()
  activeHandles = null
  state.initialized = false
  state.options = {}
}

export async function refresh(): Promise<void> {
  destroy()
  await init(state.options)
}

export function onResize(fn: ResizeCallback, opts: OnResizeOptions = {}): ResizeUnsubscribe {
  return subscribeResize(fn, opts.debounce ?? 150)
}

const api: PublicApi = { init, destroy, refresh, onResize }

declare global {
  interface Window {
    AlrdyAnimate: PublicApi
  }
}

if (typeof window !== 'undefined') {
  window.AlrdyAnimate = api
}

export { api }
