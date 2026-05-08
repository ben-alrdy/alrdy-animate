import type { GsapHandle } from '../../core/gsap-detect'
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

type ProgressKind = 'width' | 'height' | 'circle'

interface ProgressEntry {
  target: Element
  kind: ProgressKind
  property?: 'width' | 'height'
  circumference?: number
  ease: string
}

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => { kill: () => void }
}

function progressFromValues(p: ProgressEntry): Record<string, unknown> {
  if (p.kind === 'circle') return { strokeDashoffset: p.circumference }
  return { [p.property as string]: '0%' }
}
function progressToValues(p: ProgressEntry): Record<string, unknown> {
  if (p.kind === 'circle') return { strokeDashoffset: 0 }
  return { [p.property as string]: '100%' }
}

export function setupAutoplay(
  gsapHandle: GsapHandle,
  root: HTMLElement,
  api: TabsApi,
  options: AutoplayOptions,
): AutoplayController {
  const gsap = gsapHandle.gsap as unknown as Record<string, any>
  const ScrollTrigger = gsapHandle.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  const { hoverPause } = options
  const entries = api.state.entries

  let autoplayCall:
    | { kill: () => void; pause: () => void; resume: () => void; paused: () => boolean }
    | null = null
  let isPausedByHover = false
  let isHovering = false
  let currentIdx = Math.max(0, entries.findIndex((e) => api.state.isActive(e)))

  // Build progress entries for each toggle (null when no progress element).
  const progressByIdx: Array<ProgressEntry | null> = entries.map((entry) => {
    if (!entry.progress) return null
    const el = entry.progress
    const raw = el.getAttribute('aa-tabs-progress')?.toLowerCase() ?? 'width'
    const elementEase = el.getAttribute('aa-ease') ?? entry.ease

    if (raw === 'circle') {
      const circle =
        el.tagName.toLowerCase() === 'circle'
          ? (el as unknown as SVGCircleElement)
          : (el.querySelector('circle') as SVGCircleElement | null)
      if (!circle) {
        console.warn(
          '[alrdy-animate] aa-tabs-progress="circle" requires an SVG <circle> on or inside the marked element.',
          el,
        )
        return null
      }
      const r =
        typeof circle.r?.baseVal?.value === 'number'
          ? circle.r.baseVal.value
          : parseFloat(circle.getAttribute('r') ?? '0')
      const circumference = 2 * Math.PI * r
      gsap.set(circle, {
        strokeDasharray: circumference,
        strokeDashoffset: circumference,
      })
      return { target: circle, kind: 'circle', circumference, ease: elementEase }
    }

    const property: 'width' | 'height' = raw === 'height' ? 'height' : 'width'
    gsap.set(el, { [property]: '0%' })
    return { target: el, kind: property, property, ease: elementEase }
  })

  const setProgress = (idx: number, mode: 'play' | 'reset' | 'kill'): void => {
    progressByIdx.forEach((p, i) => {
      if (!p) return
      gsap.killTweensOf(p.target)
      if (mode === 'play' && i === idx) {
        const dwell = entries[i].delay > 0 ? entries[i].delay : 5
        gsap.fromTo(p.target, progressFromValues(p), {
          ...progressToValues(p),
          duration: dwell,
          ease: p.ease,
          overwrite: true,
        })
      } else {
        gsap.set(p.target, progressFromValues(p))
      }
    })
  }

  const pauseAllProgress = (): void => {
    progressByIdx.forEach((p) => {
      if (!p) return
      const tweens = (gsap.getTweensOf as (t: unknown) => Array<{ pause: () => void }>)(p.target)
      tweens.forEach((t) => t.pause())
    })
  }
  const resumeAllProgress = (): void => {
    progressByIdx.forEach((p) => {
      if (!p) return
      const tweens = (gsap.getTweensOf as (t: unknown) => Array<{ resume: () => void }>)(p.target)
      tweens.forEach((t) => t.resume())
    })
  }

  const tick = (): void => {
    const next = (currentIdx + 1) % entries.length
    currentIdx = next
    api.open(entries[next])
    setProgress(next, 'play')
    const dwell = entries[next].delay > 0 ? entries[next].delay : 5
    autoplayCall = gsap.delayedCall(dwell, tick)
  }

  const start = (): void => {
    if (autoplayCall) return
    setProgress(currentIdx, 'play')
    const dwell = entries[currentIdx].delay > 0 ? entries[currentIdx].delay : 5
    autoplayCall = gsap.delayedCall(dwell, tick)
  }

  const stop = (): void => {
    if (autoplayCall) {
      autoplayCall.kill()
      autoplayCall = null
    }
    progressByIdx.forEach((p) => {
      if (p) gsap.killTweensOf(p.target)
    })
    progressByIdx.forEach((p) => {
      if (p) gsap.set(p.target, progressFromValues(p))
    })
    isPausedByHover = false
  }

  const sync = (idx: number): void => {
    if (idx < 0 || idx >= entries.length) return
    if (autoplayCall) {
      autoplayCall.kill()
      autoplayCall = null
    }
    progressByIdx.forEach((p) => {
      if (p) {
        gsap.killTweensOf(p.target)
        gsap.set(p.target, progressFromValues(p))
      }
    })
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
    setProgress(idx, 'play')
    const dwell = entries[idx].delay > 0 ? entries[idx].delay : 5
    autoplayCall = gsap.delayedCall(dwell, tick)
  }

  const pauseByHover = (): void => {
    if (autoplayCall && !autoplayCall.paused()) {
      autoplayCall.pause()
      pauseAllProgress()
      isPausedByHover = true
    }
  }
  const resumeFromHover = (): void => {
    if (autoplayCall && isPausedByHover) {
      autoplayCall.resume()
      resumeAllProgress()
      isPausedByHover = false
    }
  }

  const cleanups: Array<() => void> = []

  if (hoverPause && !window.matchMedia('(hover: none)').matches) {
    const onEnter = (): void => {
      isHovering = true
      if (autoplayCall && !autoplayCall.paused()) pauseByHover()
    }
    const onLeave = (): void => {
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
    }
    root.addEventListener('mouseenter', onEnter)
    root.addEventListener('mouseleave', onLeave)
    cleanups.push(() => {
      root.removeEventListener('mouseenter', onEnter)
      root.removeEventListener('mouseleave', onLeave)
    })
  }

  // Viewport gate: only autoplay when the tabs root is in view.
  let st: { kill: () => void } | null = null
  if (ScrollTrigger) {
    st = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => {
        // Defer one tick so initial-active openSnap settles first.
        gsap.delayedCall(0.1, start)
      },
      onLeave: () => {
        if (autoplayCall) {
          autoplayCall.kill()
          autoplayCall = null
        }
      },
      onEnterBack: () => {
        gsap.delayedCall(0.1, start)
      },
      onLeaveBack: () => {
        if (autoplayCall) {
          autoplayCall.kill()
          autoplayCall = null
        }
      },
    })
    cleanups.push(() => st?.kill())
  } else {
    gsap.delayedCall(0.1, start)
  }

  const destroy = (): void => {
    stop()
    for (const fn of cleanups) fn()
  }

  return { start, stop, sync, destroy }
}
