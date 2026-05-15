import type { GsapHandle } from '../../core/gsap-detect'
import {
  createProgressEntry,
  progressSetFill,
  type ProgressEntry,
} from '../../core/progress-bar'
import type { TabsApi } from './index'

export interface ScrollOptions {
  distanceVh: number
  scrollStart: string
  scrub: boolean | number
}

export interface ScrollController {
  jumpToIndex: (idx: number) => void
  destroy: () => void
}

interface ScrollTriggerInstance {
  kill: () => void
  start: number
  end: number
}

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => ScrollTriggerInstance
}

interface DummyTween {
  kill: () => void
}

export function setupScroll(
  gsapHandle: GsapHandle,
  root: HTMLElement,
  api: TabsApi,
  options: ScrollOptions,
): ScrollController | null {
  const ScrollTrigger = gsapHandle.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  if (!ScrollTrigger) {
    console.warn(
      '[alrdy-animate] aa-tabs="scroll" requires ScrollTrigger. Add the plugin <script> tag before alrdy-animate.',
    )
    return null
  }
  const gsap = gsapHandle.gsap as unknown as Record<string, any>
  const entries = api.state.entries
  const N = entries.length
  if (N === 0) return null

  // Resolve each entry's progress indicator once. createProgressEntry handles
  // both width/height/circle modes and pre-sets the dasharray on circles so
  // subsequent progressSetFill writes only touch dashoffset.
  const progressByIdx: Array<ProgressEntry | null> = entries.map((entry) =>
    entry.progress
      ? createProgressEntry(entry.progress, 'aa-tabs-progress', entry.ease, gsap.set)
      : null,
  )

  // Total scroll distance in pixels (vh × N).
  const totalDistance = (N * options.distanceVh * window.innerHeight) / 100

  // Track which entry is active. The orchestrator's deferred openSnap will
  // already make entries[0] active by the time onUpdate first fires; calls
  // to api.open / api.close are no-ops when the state already matches.
  let currentIdx = -1

  const dummyProgress = { v: 0 }
  const dummyTween: DummyTween = gsap.to(dummyProgress, {
    v: 1,
    duration: 1,
    ease: 'none',
    paused: true,
    onUpdate: () => {
      const p = dummyProgress.v
      const newIdx = Math.min(Math.max(0, Math.floor(p * N)), N - 1)

      if (newIdx !== currentIdx) {
        if (currentIdx >= 0) api.close(entries[currentIdx])
        api.open(entries[newIdx])
        currentIdx = newIdx
      }

      // Per-tab progress bars: active bar fills proportionally over its
      // segment of the pin range, others stay at 0.
      progressByIdx.forEach((entry, i) => {
        if (!entry) return
        const fill = i === newIdx ? p * N - i : 0
        progressSetFill(entry, fill, gsap.set)
      })
    },
  })

  const st = ScrollTrigger.create({
    trigger: root,
    start: options.scrollStart,
    end: `+=${totalDistance}`,
    pin: true,
    pinSpacing: true,
    scrub: options.scrub,
    animation: dummyTween,
  })

  const jumpToIndex = (idx: number): void => {
    if (idx < 0 || idx >= N) return
    // Use the live ScrollTrigger range — the closure's totalDistance can drift
    // after a refresh / viewport resize.
    const liveRange = st.end - st.start
    const distancePerSegment = liveRange / N
    // Step ~5% into the segment so the active state actually changes.
    const targetY = st.start + idx * distancePerSegment + distancePerSegment * 0.05

    const w = window as unknown as Record<string, any>
    const lenis = w.lenis
    if (lenis && typeof lenis.scrollTo === 'function') {
      // Lenis is already smoothing every scroll input via its own RAF, so
      // a short scrollTo blends naturally with momentum scrolling. Longer
      // durations feel sluggish next to manual wheel scrolling.
      lenis.scrollTo(targetY, { duration: 0.3, offset: 0 })
      return
    }
    // Manual smooth scroll via gsap on a dummy. The browser's native
    // `behavior: 'smooth'` truncates short of the target when scrolling
    // through a pinned section, so we drive window.scrollTo from a tween
    // ourselves — no ScrollToPlugin required.
    const proxy = { y: window.scrollY }
    gsap.to(proxy, {
      y: targetY,
      duration: 1.2,
      ease: 'power2.inOut',
      overwrite: true,
      onUpdate: () => {
        window.scrollTo(0, proxy.y)
      },
    })
  }

  const destroy = (): void => {
    dummyTween.kill()
    st.kill()
  }

  return { jumpToIndex, destroy }
}
