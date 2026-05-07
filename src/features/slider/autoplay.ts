import type { GsapHandle } from '../../core/gsap-detect'
import type { SliderLoop } from './horizontal-loop'

export interface AutoplayOptions {
  delay: number
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

type ProgressKind = 'width' | 'height' | 'circle'

interface ProgressEntry {
  /** Element actually being tweened (the inner <circle> for circle, the marked element for width/height). */
  target: Element
  kind: ProgressKind
  /** For 'width' / 'height' — the CSS property to tween. */
  property?: 'width' | 'height'
  /** For 'circle' — pre-computed 2πr so we know where to start the dashoffset. */
  circumference?: number
  ease: string
}

function progressFromValues(entry: ProgressEntry): Record<string, unknown> {
  if (entry.kind === 'circle') return { strokeDashoffset: entry.circumference }
  return { [entry.property as string]: '0%' }
}

function progressToValues(entry: ProgressEntry): Record<string, unknown> {
  if (entry.kind === 'circle') return { strokeDashoffset: 0 }
  return { [entry.property as string]: '100%' }
}

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => { kill: () => void }
}

export function setupAutoplay(
  gsapHandle: GsapHandle,
  root: HTMLElement,
  slider: SliderLoop,
  options: AutoplayOptions,
): AutoplayController {
  const gsap = gsapHandle.gsap as unknown as Record<string, any>
  const ScrollTrigger = gsapHandle.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  const { delay, duration, ease, hoverPause } = options

  let autoplayCall:
    | { kill: () => void; pause: () => void; resume: () => void; paused: () => boolean }
    | null = null
  let isPausedByHover = false
  let dragInProgress = false

  const progressEls = Array.from(root.querySelectorAll<Element>('[aa-slider-progress]'))

  const progress: ProgressEntry[] = []
  for (const el of progressEls) {
    const raw = el.getAttribute('aa-slider-progress')?.toLowerCase() ?? 'width'
    const elementEase = el.getAttribute('aa-ease') ?? ease

    if (raw === 'circle') {
      // The marked element is expected to be (or contain) an SVG <circle>.
      // We tween the <circle>'s stroke-dashoffset from its circumference
      // (fully hidden) down to 0 (fully drawn). The user controls size,
      // colour, stroke-width via CSS / SVG attributes.
      const circle =
        el.tagName.toLowerCase() === 'circle'
          ? (el as unknown as SVGCircleElement)
          : (el.querySelector('circle') as SVGCircleElement | null)
      if (!circle) {
        console.warn(
          '[alrdy-animate] aa-slider-progress="circle" requires an SVG <circle> (the marked element or a descendant).',
          el,
        )
        continue
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
      progress.push({ target: circle, kind: 'circle', circumference, ease: elementEase })
      continue
    }

    const property: 'width' | 'height' = raw === 'height' ? 'height' : 'width'
    gsap.set(el, { [property]: '0%' })
    progress.push({ target: el, kind: property, property, ease: elementEase })
  }

  const syncProgress = (activeIndex: number): void => {
    progress.forEach((entry, i) => {
      gsap.killTweensOf(entry.target)
      if (i === activeIndex) {
        gsap.fromTo(entry.target, progressFromValues(entry), {
          ...progressToValues(entry),
          duration: delay,
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
      autoplayCall = gsap.delayedCall(duration + delay, tick)
    }
    syncProgress(slider.current())
    autoplayCall = gsap.delayedCall(delay, tick)
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
  if (hoverPause && !window.matchMedia('(hover: none)').matches) {
    const onEnter = (): void => {
      if (autoplayCall && !autoplayCall.paused()) pauseByHover()
    }
    const onLeave = (): void => {
      if (isPausedByHover) resumeFromHover()
      else if (!autoplayCall && !dragInProgress) start()
    }
    root.addEventListener('mouseenter', onEnter)
    root.addEventListener('mouseleave', onLeave)
    cleanups.push(() => {
      root.removeEventListener('mouseenter', onEnter)
      root.removeEventListener('mouseleave', onLeave)
    })
  }

  // Pause autoplay when slider scrolls out of viewport.
  let st: { kill: () => void } | null = null
  if (ScrollTrigger) {
    st = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: start,
      onLeave: stop,
      onEnterBack: start,
      onLeaveBack: stop,
    })
    cleanups.push(() => st?.kill())
  } else {
    // No ScrollTrigger plugin → just start immediately.
    start()
  }

  const destroy = (): void => {
    stop()
    for (const fn of cleanups) fn()
  }

  const setDragInProgress = (active: boolean): void => {
    dragInProgress = active
  }

  return { start, stop, syncProgress, reset, setDragInProgress, destroy }
}
