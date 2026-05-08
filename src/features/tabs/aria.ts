import type { TabEntry, TabState } from './state'

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
