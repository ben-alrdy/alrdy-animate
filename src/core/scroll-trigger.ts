import type { GsapHandle } from './gsap-detect'

interface ScrollTriggerInstance {
  kill: () => void
}

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => ScrollTriggerInstance
}

/**
 * Resolve the effective ScrollTrigger `start` for an element.
 *
 * Precedence (highest first):
 *   1. `aa-scroll-start` on the element
 *   2. `init({ scrubStart })`, but only when `aa-scrub` is set on the element
 *   3. `init({ scrollStart })`
 *
 * `scrubStart` exists so the docs/Webflow author can fire scrubbed animations
 * earlier (e.g. `top 90%`) than the snappier non-scrubbed default (e.g.
 * `top 85%`), without touching every element. Without this resolver, only the
 * `scroll` feature consulted `scrubStart`; `text`, `reveal`, and the reduced-
 * motion scrub fallback silently fell through to `scrollStart`.
 */
export function resolveScrollStart(
  attrValue: string | undefined,
  opts: { scrollStart: string; scrubStart?: string },
  scrub: number | boolean | undefined,
): string {
  if (attrValue !== undefined) return attrValue
  // `scrub === false` is an explicit opt-out (aa-scrub="false" → no scrub), so
  // it should NOT promote scrubStart. Only truthy `scrub` activates the
  // scrub-specific start.
  if (scrub && opts.scrubStart !== undefined) return opts.scrubStart
  return opts.scrollStart
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
 * Returns a function that kills the created ScrollTriggers — useful when the
 * caller needs to tear down + rebuild without waiting for a matchMedia revert
 * (e.g. SplitText auto-resplit replaces the animated DOM nodes mid-breakpoint).
 *
 * Must be called inside a `gsap.matchMedia()` scope so the created
 * ScrollTriggers are tracked and auto-cleaned on breakpoint exit / destroy().
 */
export function bindAgainTrigger(opts: AgainTriggerOptions): () => void {
  const ScrollTrigger = opts.gsap.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  if (!ScrollTrigger) return () => {}

  const triggers: ScrollTriggerInstance[] = []

  triggers.push(
    ScrollTrigger.create({
      trigger: opts.trigger,
      start: opts.start,
      onEnter: () => opts.onPlay(),
    }),
  )

  if (opts.again) {
    triggers.push(
      ScrollTrigger.create({
        trigger: opts.trigger,
        start: () => {
          const rect = opts.trigger.getBoundingClientRect()
          const matrix = new DOMMatrix(getComputedStyle(opts.trigger).transform)
          return rect.top + window.scrollY - matrix.f - window.innerHeight
        },
        onLeaveBack: () => opts.onReset(),
      }),
    )
  }

  return () => {
    for (const t of triggers) t.kill()
  }
}
