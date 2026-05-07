export interface KeyboardHandlers {
  next: () => void
  previous: () => void
  toIndex: (index: number) => void
}

const HANDLED_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End'])

export function attachKeyboard(
  root: HTMLElement,
  total: number,
  handlers: KeyboardHandlers,
): () => void {
  // Make the slider focusable if it isn't already; arrow keys only fire when
  // the slider has focus (or focus is on a slide/thumb inside it).
  const hadTabindex = root.hasAttribute('tabindex')
  if (!hadTabindex) root.setAttribute('tabindex', '0')

  const onKey = (e: KeyboardEvent): void => {
    if (!HANDLED_KEYS.has(e.key)) return
    // Ignore key events from form controls inside the slider — those have
    // their own arrow-key semantics.
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

    e.preventDefault()
    switch (e.key) {
      case 'ArrowRight':
        handlers.next()
        break
      case 'ArrowLeft':
        handlers.previous()
        break
      case 'Home':
        handlers.toIndex(0)
        break
      case 'End':
        if (total > 0) handlers.toIndex(total - 1)
        break
    }
  }

  root.addEventListener('keydown', onKey)

  return () => {
    root.removeEventListener('keydown', onKey)
    if (!hadTabindex) root.removeAttribute('tabindex')
  }
}
