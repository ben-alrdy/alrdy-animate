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
import { subscribeWithPair, MODAL_CARD_SELECTOR, MODAL_STATUS_ATTR } from './trigger'

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
 *
 * Inside a modal the gate switches strategy: a modal is `position:fixed`, and
 * ScrollTrigger's scroll-based in-view math misjudges fixed elements — when the
 * modal is opened at a non-zero scroll, the refresh every resize triggers can
 * decide the element is off-screen and fire `onIdle`, freezing the gated
 * animation for good (a fixed element never scrolls back into view). So we gate
 * on the modal's own open/close lifecycle instead: active while open, idle while
 * closed. This is also more correct — there's no point running the animation
 * while the modal is hidden.
 */
export function createViewportGate(
  gsapHandle: GsapHandle,
  opts: ViewportGateOptions,
): (() => void) | null {
  const modalCard = opts.trigger.closest<HTMLElement>(MODAL_CARD_SELECTOR)
  if (modalCard) {
    const dispose = subscribeWithPair({
      element: opts.trigger,
      forwardName: 'modal-active',
      onForward: opts.onActive,
      onReverse: opts.onIdle,
    })
    // The gate is usually created after `modal-active` has already fired (the
    // marquee/slider builds on reveal, mid-open), so reflect the current open
    // state now — a future-only subscription would otherwise sit idle until the
    // next open/close toggle.
    if (modalCard.getAttribute(MODAL_STATUS_ATTR) === 'active') opts.onActive()
    else opts.onIdle()
    return dispose
  }

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
