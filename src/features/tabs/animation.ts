import type { GsapHandle } from '../../core/gsap-detect'
import { emitTrigger } from '../../core/trigger'
import type { TabEntry } from './state'

export interface OpenOptions {
  /**
   * Hold the visual's `tab-active` emit (and the auto cross-fade) for this
   * many seconds. Set by the orchestrator to the previous entry's visual
   * duration so a user-defined animate-out finishes before the new one's
   * animate-in starts.
   */
  visualDelay?: number
  onComplete?: () => void
}

export interface AnimationController {
  /** Set every entry to its closed/inactive visual state (no animation). */
  applyInitialClosed: (entries: TabEntry[]) => void
  /** Snap an entry into its open state without animating (used for initial active). */
  applyInitialOpen: (entry: TabEntry) => void
  /** Run the open animation: height 0 → auto, visual autoAlpha 0 → 1. Emits tab-active. */
  open: (entry: TabEntry, opts?: OpenOptions) => void
  /** Run the close animation: height current → 0, visual autoAlpha 1 → 0. Emits tab-inactive. */
  close: (entry: TabEntry, onComplete?: () => void) => void
  /** Kill all in-flight tweens and clear inline styles we added. */
  cleanup: (entries: TabEntry[]) => void
}

type GsapAny = Record<string, any>

const ANIMATE_ATTRS = ['aa-animate', 'aa-animate-sm', 'aa-animate-md', 'aa-animate-lg', 'aa-animate-xl']

/**
 * When the author wraps their own `aa-animate` onto the visual element, we
 * step out of the way: their animation owns visibility (and any transform).
 * Auto-cross-fade only kicks in when the visual is decorative markup.
 */
function visualHasOwnAnimation(visual: HTMLElement | null): boolean {
  if (!visual) return false
  for (const attr of ANIMATE_ATTRS) {
    if (visual.hasAttribute(attr)) return true
  }
  return false
}

export const hasVisualAnimation = visualHasOwnAnimation

function emitOnTargets(entry: TabEntry, name: string): void {
  emitTrigger(entry.toggle, name)
  if (entry.content) emitTrigger(entry.content, name)
  if (entry.visual) emitTrigger(entry.visual, name)
}

export function createAnimationController(gsapHandle: GsapHandle): AnimationController {
  const gsap = gsapHandle.gsap as unknown as GsapAny

  // Track the in-flight delayed visual emit so a rapid second open kills the
  // pending one instead of double-firing tab-active on the visual.
  let pendingVisualOpen: { kill: () => void } | null = null

  const openHeight = (content: HTMLElement, duration: number, ease: string, onComplete?: () => void): void => {
    gsap.killTweensOf(content)
    const startHeight = content.getBoundingClientRect().height
    gsap.set(content, { height: startHeight })
    gsap.to(content, {
      height: 'auto',
      duration,
      ease,
      onComplete: () => {
        // Clear the inline height so subsequent layout (e.g. images that
        // load after open, child margin collapse) flows naturally. The
        // CSS rule [aa-tabs-content] { overflow: hidden } stays in place
        // so the close tween can clip again from natural height to 0.
        gsap.set(content, { clearProps: 'height' })
        onComplete?.()
      },
    })
  }

  const closeHeight = (content: HTMLElement, duration: number, ease: string, onComplete?: () => void): void => {
    gsap.killTweensOf(content)
    const startHeight = content.getBoundingClientRect().height
    gsap.set(content, { height: startHeight })
    gsap.to(content, { height: 0, duration, ease, onComplete })
  }

  const showVisual = (visual: HTMLElement, duration: number, ease: string): void => {
    gsap.killTweensOf(visual)
    gsap.to(visual, { autoAlpha: 1, duration, ease })
  }

  const hideVisual = (visual: HTMLElement, duration: number, ease: string): void => {
    gsap.killTweensOf(visual)
    gsap.to(visual, { autoAlpha: 0, duration, ease })
  }

  const applyInitialClosed = (entries: TabEntry[]): void => {
    for (const e of entries) {
      if (e.content) gsap.set(e.content, { height: 0 })
      if (e.visual && !visualHasOwnAnimation(e.visual)) {
        gsap.set(e.visual, { autoAlpha: 0 })
      }
    }
  }

  const applyInitialOpen = (entry: TabEntry): void => {
    if (entry.content) gsap.set(entry.content, { clearProps: 'height' })
    if (entry.visual && !visualHasOwnAnimation(entry.visual)) {
      gsap.set(entry.visual, { autoAlpha: 1, visibility: 'visible' })
    }
    emitOnTargets(entry, 'tab-active')
  }

  const open = (entry: TabEntry, opts?: OpenOptions): void => {
    pendingVisualOpen?.kill()
    pendingVisualOpen = null

    // Toggle + content fire immediately so the click feels responsive and the
    // height tween starts. The visual emit is what's optionally delayed.
    emitTrigger(entry.toggle, 'tab-active')
    if (entry.content) emitTrigger(entry.content, 'tab-active')
    if (entry.content) {
      openHeight(entry.content, entry.contentDuration, entry.ease, opts?.onComplete)
    } else {
      opts?.onComplete?.()
    }

    if (entry.visual) {
      const visualEl = entry.visual
      const fireVisual = (): void => {
        emitTrigger(visualEl, 'tab-active')
        if (!visualHasOwnAnimation(visualEl)) {
          showVisual(visualEl, entry.visualDuration, entry.ease)
        }
        pendingVisualOpen = null
      }
      const delay = opts?.visualDelay
      if (delay && delay > 0) {
        pendingVisualOpen = gsap.delayedCall(delay, fireVisual)
      } else {
        fireVisual()
      }
    }
  }

  const close = (entry: TabEntry, onComplete?: () => void): void => {
    emitOnTargets(entry, 'tab-inactive')
    if (entry.content) {
      closeHeight(entry.content, entry.contentDuration, entry.ease, onComplete)
    } else {
      onComplete?.()
    }
    if (entry.visual && !visualHasOwnAnimation(entry.visual)) {
      hideVisual(entry.visual, entry.visualDuration, entry.ease)
    }
  }

  const cleanup = (entries: TabEntry[]): void => {
    pendingVisualOpen?.kill()
    pendingVisualOpen = null
    for (const e of entries) {
      if (e.content) {
        gsap.killTweensOf(e.content)
        gsap.set(e.content, { clearProps: 'height' })
      }
      if (e.visual) {
        gsap.killTweensOf(e.visual)
        gsap.set(e.visual, { clearProps: 'opacity,visibility' })
      }
      if (e.progress) gsap.killTweensOf(e.progress)
    }
  }

  return { applyInitialClosed, applyInitialOpen, open, close, cleanup }
}
