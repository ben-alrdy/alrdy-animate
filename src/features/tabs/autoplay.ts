import type { GsapHandle } from '../../core/gsap-detect'
import {
  createProgressEntry,
  createProgressGroup,
  type ProgressEntry,
} from '../../core/progress-bar'
import { attachHoverPauseListener, createViewportGate } from '../../core/viewport-gate'
import type { TabsApi } from './index'

export interface AutoplayOptions {
  hoverPause: boolean
}

export interface AutoplayController {
  start: () => void
  stop: () => void
  /** User-jumped to a specific tab. Reset progress and resume cycling from idx. */
  sync: (idx: number) => void
  destroy: () => void
}

export function setupAutoplay(
  gsapHandle: GsapHandle,
  root: HTMLElement,
  api: TabsApi,
  options: AutoplayOptions,
): AutoplayController {
  const gsap = gsapHandle.gsap as unknown as Record<string, any>
  const { hoverPause } = options
  const entries = api.state.entries

  let autoplayCall:
    | { kill: () => void; pause: () => void; resume: () => void; paused: () => boolean }
    | null = null
  let isPausedByHover = false
  let isHovering = false
  let currentIdx = Math.max(0, entries.findIndex((e) => api.state.isActive(e)))

  // Build progress entries for each toggle (null when no progress element).
  const progressByIdx: Array<ProgressEntry | null> = entries.map((entry) =>
    entry.progress
      ? createProgressEntry(entry.progress, 'aa-tabs-progress', entry.ease, gsap.set)
      : null,
  )
  const progress = createProgressGroup(gsap, progressByIdx)
  // Each tab carries its own dwell, so the active bar fills over that tab's interval.
  const dwellFor = (i: number): number => entries[i].interval

  const tick = (): void => {
    const next = (currentIdx + 1) % entries.length
    currentIdx = next
    api.open(entries[next])
    progress.play(next, dwellFor)
    const dwell = entries[next].interval
    autoplayCall = gsap.delayedCall(dwell, tick)
  }

  const start = (): void => {
    if (autoplayCall) return
    progress.play(currentIdx, dwellFor)
    const dwell = entries[currentIdx].interval
    autoplayCall = gsap.delayedCall(dwell, tick)
  }

  const stop = (): void => {
    if (autoplayCall) {
      autoplayCall.kill()
      autoplayCall = null
    }
    progress.reset()
    isPausedByHover = false
  }

  const sync = (idx: number): void => {
    if (idx < 0 || idx >= entries.length) return
    if (autoplayCall) {
      autoplayCall.kill()
      autoplayCall = null
    }
    progress.reset()
    currentIdx = idx
    api.open(entries[idx])
    // In hover-pause mode, a click *while hovering* should leave autoplay
    // paused — the user is reading the panel. mouseleave will start a fresh
    // cycle from this index. With plain autoplay, restart immediately.
    if (hoverPause && isHovering) {
      isPausedByHover = true
      return
    }
    isPausedByHover = false
    progress.play(idx, dwellFor)
    const dwell = entries[idx].interval
    autoplayCall = gsap.delayedCall(dwell, tick)
  }

  const pauseByHover = (): void => {
    if (autoplayCall && !autoplayCall.paused()) {
      autoplayCall.pause()
      progress.pause()
      isPausedByHover = true
    }
  }
  const resumeFromHover = (): void => {
    if (autoplayCall && isPausedByHover) {
      autoplayCall.resume()
      progress.resume()
      isPausedByHover = false
    }
  }

  const cleanups: Array<() => void> = []

  if (hoverPause) {
    cleanups.push(
      attachHoverPauseListener({
        root,
        onEnter: () => {
          isHovering = true
          if (autoplayCall && !autoplayCall.paused()) pauseByHover()
        },
        onLeave: () => {
          isHovering = false
          if (!isPausedByHover) return
          // If a paused tween is still alive, resume it where it left off. If
          // the tween was killed (e.g. user clicked a tab while hovering), spin
          // up a fresh cycle from currentIdx instead.
          if (autoplayCall) {
            resumeFromHover()
          } else {
            isPausedByHover = false
            start()
          }
        },
      }),
    )
  }

  // Viewport gate: only autoplay when the tabs root is in view. `onActive`
  // defers one tick so the initial-active openSnap settles first; `onIdle`
  // kills the in-flight delayedCall.
  const onIdle = (): void => {
    if (autoplayCall) {
      autoplayCall.kill()
      autoplayCall = null
    }
  }
  const onActive = (): void => {
    gsap.delayedCall(0.1, start)
  }
  const gateDispose = createViewportGate(gsapHandle, { trigger: root, onActive, onIdle })
  if (gateDispose) cleanups.push(gateDispose)
  else onActive() // No ScrollTrigger plugin → just start (deferred).

  const destroy = (): void => {
    stop()
    for (const fn of cleanups) fn()
  }

  return { start, stop, sync, destroy }
}
