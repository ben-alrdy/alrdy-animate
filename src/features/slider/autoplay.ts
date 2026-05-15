import type { GsapHandle } from '../../core/gsap-detect'
import {
  createProgressEntry,
  progressFromValues,
  progressToValues,
  type ProgressEntry,
} from '../../core/progress-bar'
import { attachHoverPauseListener, createViewportGate } from '../../core/viewport-gate'
import type { SliderLoop } from './horizontal-loop'

export interface AutoplayOptions {
  /** Seconds between slide advances. */
  interval: number
  /** Slide-transition duration (used by the slider tween, not autoplay timing). */
  duration: number
  ease: string
  hoverPause: boolean
}

export interface AutoplayController {
  start: () => void
  stop: () => void
  /** Update progress bars to reflect the given active slide index. */
  syncProgress: (index: number) => void
  /** Pause autoplay (without resetting progress). For external nav restarts. */
  reset: () => void
  /**
   * Mark whether a drag/throw is in progress. When true, the hover
   * mouseleave handler won't auto-start autoplay (the caller will restart
   * once the throw completes on the correct landing slide).
   */
  setDragInProgress: (active: boolean) => void
  destroy: () => void
}

export function setupAutoplay(
  gsapHandle: GsapHandle,
  root: HTMLElement,
  slider: SliderLoop,
  options: AutoplayOptions,
): AutoplayController {
  const gsap = gsapHandle.gsap as unknown as Record<string, any>
  const { interval, duration, ease, hoverPause } = options

  let autoplayCall:
    | { kill: () => void; pause: () => void; resume: () => void; paused: () => boolean }
    | null = null
  let isPausedByHover = false
  let dragInProgress = false

  const progress: ProgressEntry[] = []
  for (const el of root.querySelectorAll<Element>('[aa-slider-progress]')) {
    const entry = createProgressEntry(el, 'aa-slider-progress', ease, gsap.set)
    if (entry) progress.push(entry)
  }

  const syncProgress = (activeIndex: number): void => {
    progress.forEach((entry, i) => {
      gsap.killTweensOf(entry.target)
      if (i === activeIndex) {
        gsap.fromTo(entry.target, progressFromValues(entry), {
          ...progressToValues(entry),
          duration: interval,
          ease: entry.ease,
          overwrite: true,
        })
      } else {
        gsap.set(entry.target, progressFromValues(entry))
      }
    })
  }

  const stopProgress = (): void => {
    for (const entry of progress) gsap.killTweensOf(entry.target)
  }

  const resetAllProgress = (): void => {
    for (const entry of progress) gsap.set(entry.target, progressFromValues(entry))
  }

  const pauseProgress = (): void => {
    for (const entry of progress) {
      const tweens = (gsap.getTweensOf as (t: unknown) => Array<{ pause: () => void }>)(
        entry.target,
      )
      tweens.forEach((t) => t.pause())
    }
  }

  const resumeProgress = (): void => {
    for (const entry of progress) {
      const tweens = (gsap.getTweensOf as (t: unknown) => Array<{ resume: () => void }>)(
        entry.target,
      )
      tweens.forEach((t) => t.resume())
    }
  }

  const start = (): void => {
    if (autoplayCall) return
    const tick = (): void => {
      slider.next({ duration, ease })
      gsap.delayedCall(duration / 2, () => {
        syncProgress(slider.current())
      })
      autoplayCall = gsap.delayedCall(duration + interval, tick)
    }
    syncProgress(slider.current())
    autoplayCall = gsap.delayedCall(interval, tick)
  }

  const stop = (): void => {
    if (autoplayCall) {
      autoplayCall.kill()
      autoplayCall = null
    }
    stopProgress()
    resetAllProgress()
    isPausedByHover = false
  }

  const reset = (): void => {
    stop()
  }

  const pauseByHover = (): void => {
    if (autoplayCall) {
      autoplayCall.pause()
      pauseProgress()
      isPausedByHover = true
    }
  }

  const resumeFromHover = (): void => {
    if (autoplayCall && isPausedByHover) {
      autoplayCall.resume()
      resumeProgress()
      isPausedByHover = false
    }
  }

  const cleanups: Array<() => void> = []

  // Hover pause is opt-in (autoplay-hover token) and only on non-touch devices.
  if (hoverPause) {
    cleanups.push(
      attachHoverPauseListener({
        root,
        onEnter: () => {
          if (autoplayCall && !autoplayCall.paused()) pauseByHover()
        },
        onLeave: () => {
          if (isPausedByHover) resumeFromHover()
          else if (!autoplayCall && !dragInProgress) start()
        },
      }),
    )
  }

  // Pause autoplay when slider scrolls out of viewport.
  const gateDispose = createViewportGate(gsapHandle, {
    trigger: root,
    onActive: start,
    onIdle: stop,
  })
  if (gateDispose) cleanups.push(gateDispose)
  else start() // No ScrollTrigger plugin → just start immediately.

  const destroy = (): void => {
    stop()
    for (const fn of cleanups) fn()
  }

  const setDragInProgress = (active: boolean): void => {
    dragInProgress = active
  }

  return { start, stop, syncProgress, reset, setDragInProgress, destroy }
}
