/**
 * Shared gating helpers for autoplay-driven features (slider, tabs, marquee).
 *
 * Two patterns lived in three feature modules verbatim:
 *
 *   1. A ScrollTrigger that calls `onActive` whenever the root is in view
 *      (onEnter / onEnterBack) and `onIdle` when it leaves (onLeave /
 *      onLeaveBack). Skips silently when ScrollTrigger isn't loaded — the
 *      caller falls back to "always active" via the no-ScrollTrigger branch.
 *
 *   2. A `mouseenter` / `mouseleave` listener pair gated on
 *      `(hover: none)` so touch devices don't trigger it.
 *
 * The feature-specific state (drag-in-progress flag, isPausedByHover boolean,
 * progress-tween pausing) stays in the feature module — only the listener
 * plumbing is shared here.
 */

import type { GsapHandle } from './gsap-detect'

interface ScrollTriggerInstance {
  kill: () => void
}

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => ScrollTriggerInstance
}

export interface ViewportGateOptions {
  trigger: Element
  onActive: () => void
  onIdle: () => void
}

/**
 * Create a ScrollTrigger that fires `onActive` on enter/enterBack and `onIdle`
 * on leave/leaveBack. Returns a disposer that kills the trigger. Returns `null`
 * when ScrollTrigger isn't available — caller decides whether to default to
 * always-active or skip silently.
 */
export function createViewportGate(
  gsapHandle: GsapHandle,
  opts: ViewportGateOptions,
): (() => void) | null {
  const ScrollTrigger = gsapHandle.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  if (!ScrollTrigger) return null

  const st = ScrollTrigger.create({
    trigger: opts.trigger,
    start: 'top bottom',
    end: 'bottom top',
    onEnter: opts.onActive,
    onEnterBack: opts.onActive,
    onLeave: opts.onIdle,
    onLeaveBack: opts.onIdle,
  })

  return () => st.kill()
}

export interface HoverPauseOptions {
  root: Element
  onEnter: () => void
  onLeave: () => void
}

/**
 * Attach mouseenter / mouseleave listeners gated on pointer capability. Touch
 * devices (`(hover: none)`) skip both listeners entirely so a sustained
 * pointerover doesn't freeze the feature mid-scroll.
 *
 * Returns a disposer; safe to call even when listeners weren't attached
 * (touch devices).
 */
export function attachHoverPauseListener(opts: HoverPauseOptions): () => void {
  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
    return () => {}
  }
  opts.root.addEventListener('mouseenter', opts.onEnter)
  opts.root.addEventListener('mouseleave', opts.onLeave)
  return () => {
    opts.root.removeEventListener('mouseenter', opts.onEnter)
    opts.root.removeEventListener('mouseleave', opts.onLeave)
  }
}
