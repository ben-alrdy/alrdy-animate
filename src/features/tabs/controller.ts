import type { GsapHandle } from '../../core/gsap-detect'
import { hasAnimateAttribute } from '../../core/parse'
import { emitTrigger } from '../../core/trigger'
import type { TabEntry, TabState } from './state'

// ---------------------------------------------------------------------------
// Animation controller
// ---------------------------------------------------------------------------

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

/**
 * When the author wraps their own `aa-animate` onto the visual element, we
 * step out of the way: their animation owns visibility (and any transform).
 * Auto-cross-fade only kicks in when the visual is decorative markup.
 */
export function hasVisualAnimation(visual: HTMLElement | null): boolean {
  return hasAnimateAttribute(visual)
}

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
      if (e.visual && !hasVisualAnimation(e.visual)) {
        gsap.set(e.visual, { autoAlpha: 0 })
      }
    }
  }

  const applyInitialOpen = (entry: TabEntry): void => {
    if (entry.content) gsap.set(entry.content, { clearProps: 'height' })
    if (entry.visual && !hasVisualAnimation(entry.visual)) {
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
        if (!hasVisualAnimation(visualEl)) {
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
    if (entry.visual && !hasVisualAnimation(entry.visual)) {
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

// ---------------------------------------------------------------------------
// Aria controller
// ---------------------------------------------------------------------------

let tabsInstanceCounter = 0

export interface AriaController {
  applyInitial: () => void
  applyOpen: (entry: TabEntry) => void
  applyClosed: (entry: TabEntry) => void
  cleanup: () => void
}

interface EntryAriaShape {
  /** True when toggle has matching content (accordion semantics — button/region). */
  accordion: boolean
  /** True when entry uses tab semantics (visual-only). */
  tab: boolean
  toggleId: string
  contentId: string | null
  visualId: string | null
}

function shapeFor(entry: TabEntry, instanceId: number): EntryAriaShape {
  const accordion = !!entry.content
  const tab = !accordion && !!entry.visual
  const toggleId = `aa-tabs-${instanceId}-toggle-${entry.index}`
  const contentId = entry.content ? `aa-tabs-${instanceId}-content-${entry.index}` : null
  const visualId = entry.visual ? `aa-tabs-${instanceId}-visual-${entry.index}` : null
  return { accordion, tab, toggleId, contentId, visualId }
}

export function createAriaController(state: TabState): AriaController {
  const instanceId = tabsInstanceCounter++
  const shapes = new Map<TabEntry, EntryAriaShape>()
  for (const entry of state.entries) shapes.set(entry, shapeFor(entry, instanceId))

  const undo: Array<() => void> = []

  const setAttrTracked = (el: Element, attr: string, value: string): void => {
    const had = el.hasAttribute(attr)
    const prev = had ? el.getAttribute(attr) : null
    el.setAttribute(attr, value)
    undo.push(() => {
      if (had && prev !== null) el.setAttribute(attr, prev)
      else el.removeAttribute(attr)
    })
  }

  const setAttrIfMissing = (el: Element, attr: string, value: string): void => {
    if (el.hasAttribute(attr)) return
    el.setAttribute(attr, value)
    undo.push(() => el.removeAttribute(attr))
  }

  const applyInitial = (): void => {
    for (const entry of state.entries) {
      const shape = shapes.get(entry)
      if (!shape) continue

      // Toggle gets a stable id and tabindex regardless of pattern.
      setAttrIfMissing(entry.toggle, 'id', shape.toggleId)
      setAttrIfMissing(entry.toggle, 'tabindex', '0')

      if (shape.accordion) {
        setAttrTracked(entry.toggle, 'role', 'button')
        setAttrTracked(entry.toggle, 'aria-expanded', 'false')
        if (entry.content && shape.contentId) {
          setAttrTracked(entry.toggle, 'aria-controls', shape.contentId)
          setAttrIfMissing(entry.content, 'id', shape.contentId)
          setAttrTracked(entry.content, 'role', 'region')
          setAttrTracked(entry.content, 'aria-labelledby', shape.toggleId)
        }
        if (entry.visual) {
          // Visual is decorative when paired with a content panel.
          setAttrTracked(entry.visual, 'aria-hidden', 'true')
        }
      } else if (shape.tab) {
        setAttrTracked(entry.toggle, 'role', 'tab')
        setAttrTracked(entry.toggle, 'aria-selected', 'false')
        if (entry.visual && shape.visualId) {
          setAttrTracked(entry.toggle, 'aria-controls', shape.visualId)
          setAttrIfMissing(entry.visual, 'id', shape.visualId)
          setAttrTracked(entry.visual, 'role', 'tabpanel')
          setAttrTracked(entry.visual, 'aria-labelledby', shape.toggleId)
        }
      }
    }

    // If every entry is tab-like (visual-only), the parent of the first toggle
    // becomes the tablist. Mirrors v7 — but only when the pattern is uniform.
    if (state.hasVisualOnly && state.entries.length > 0) {
      const parent = state.entries[0].toggle.parentElement
      if (parent) setAttrTracked(parent, 'role', 'tablist')
    }
  }

  const applyOpen = (entry: TabEntry): void => {
    const shape = shapes.get(entry)
    if (!shape) return
    if (shape.accordion) {
      entry.toggle.setAttribute('aria-expanded', 'true')
      if (entry.visual) entry.visual.setAttribute('aria-hidden', 'false')
    } else if (shape.tab) {
      entry.toggle.setAttribute('aria-selected', 'true')
    }
  }

  const applyClosed = (entry: TabEntry): void => {
    const shape = shapes.get(entry)
    if (!shape) return
    if (shape.accordion) {
      entry.toggle.setAttribute('aria-expanded', 'false')
      if (entry.visual) entry.visual.setAttribute('aria-hidden', 'true')
    } else if (shape.tab) {
      entry.toggle.setAttribute('aria-selected', 'false')
    }
  }

  const cleanup = (): void => {
    while (undo.length) {
      const fn = undo.pop()
      if (fn) fn()
    }
  }

  return { applyInitial, applyOpen, applyClosed, cleanup }
}
