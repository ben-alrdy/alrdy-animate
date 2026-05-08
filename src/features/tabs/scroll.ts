import type { GsapHandle } from '../../core/gsap-detect'
import type { TabsApi } from './index'
import type { TabEntry } from './state'

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

function getCircle(el: HTMLElement): SVGCircleElement | null {
  if (el.tagName.toLowerCase() === 'circle') return el as unknown as SVGCircleElement
  return el.querySelector('circle')
}

function progressKind(el: HTMLElement): 'width' | 'height' | 'circle' {
  const raw = el.getAttribute('aa-tabs-progress')?.toLowerCase()
  if (raw === 'circle') return 'circle'
  if (raw === 'height') return 'height'
  return 'width'
}

function setProgressBar(
  entry: TabEntry,
  fill: number, // 0..1
  gsap: Record<string, any>,
): void {
  const el = entry.progress
  if (!el) return
  const clamped = Math.max(0, Math.min(1, fill))
  const kind = progressKind(el)
  if (kind === 'circle') {
    const circle = getCircle(el)
    if (!circle) return
    const r = parseFloat(circle.getAttribute('r') ?? '0') || 25
    const c = 2 * Math.PI * r
    circle.style.strokeDasharray = String(c)
    circle.style.strokeDashoffset = String(c - clamped * c)
    return
  }
  gsap.set(el, { [kind]: `${clamped * 100}%` })
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
      entries.forEach((entry, i) => {
        if (!entry.progress) return
        if (i === newIdx) {
          const local = p * N - i
          setProgressBar(entry, local, gsap)
        } else {
          setProgressBar(entry, 0, gsap)
        }
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
    const ScrollToPlugin = w.ScrollToPlugin
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(targetY, { duration: 1.2, offset: 0 })
      return
    }
    if (ScrollToPlugin) {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: targetY, autoKill: false },
        ease: 'power2.inOut',
      })
      return
    }
    // Manual smooth scroll via gsap on a dummy. The browser's native
    // `behavior: 'smooth'` truncates short of the target when scrolling
    // through a pinned section, so we drive window.scrollTo from a tween
    // ourselves. Works without ScrollToPlugin.
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
