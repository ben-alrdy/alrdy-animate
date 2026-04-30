import type { GsapHandle } from './gsap-detect'
import type { ResponsiveController } from './match-media'
import { addDisposer, runAllDisposers, state } from './state'

export interface LifecycleHandles {
  gsap: GsapHandle
  responsive: ResponsiveController
}

export function registerCleanup(fn: () => void): void {
  addDisposer(fn)
}

export function teardown(handles?: LifecycleHandles): void {
  if (handles?.responsive) {
    try {
      handles.responsive.revertAll()
    } catch (err) {
      console.error('[alrdy-animate] responsive controller revert threw', err)
    }
  }
  runAllDisposers()
  state.initialized = false
}
