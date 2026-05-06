import type { GsapHandle } from './gsap-detect'

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => unknown
}

export interface AgainTriggerOptions {
  gsap: GsapHandle
  trigger: Element
  start: string
  again: boolean
  onPlay: () => void
  onReset: () => void
}

/**
 * Wires the canonical "play once on enter, optionally reset when fully
 * scrolled past going up" trigger pair.
 *
 * The reset point is the element's natural top minus one viewport height —
 * i.e. the moment the element fully leaves the bottom of the viewport on the
 * way back. This avoids the `toggleActions: 'play none none reverse'`
 * behaviour that reverses as soon as the element re-crosses its original
 * start position, which feels too eager for entrance animations.
 *
 * Must be called inside a `gsap.matchMedia()` scope so the created
 * ScrollTriggers are tracked and auto-cleaned on breakpoint exit / destroy().
 */
export function bindAgainTrigger(opts: AgainTriggerOptions): void {
  const ScrollTrigger = opts.gsap.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  if (!ScrollTrigger) return

  ScrollTrigger.create({
    trigger: opts.trigger,
    start: opts.start,
    onEnter: () => opts.onPlay(),
  })

  if (!opts.again) return

  ScrollTrigger.create({
    trigger: opts.trigger,
    start: () => {
      const rect = opts.trigger.getBoundingClientRect()
      const matrix = new DOMMatrix(getComputedStyle(opts.trigger).transform)
      return rect.top + window.scrollY - matrix.f - window.innerHeight
    },
    onLeaveBack: () => opts.onReset(),
  })
}
