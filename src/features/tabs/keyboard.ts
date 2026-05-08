export interface KeyboardHandlers {
  activate: (toggle: HTMLElement) => void
}

const ACTIVATE_KEYS = new Set(['Enter', ' '])
const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])

export function attachKeyboard(
  root: HTMLElement,
  toggles: HTMLElement[],
  handlers: KeyboardHandlers,
): () => void {
  if (toggles.length === 0) return () => {}

  const onKey = (e: KeyboardEvent): void => {
    const target = e.target as Element | null
    if (!target) return
    const toggle = target.closest<HTMLElement>('[aa-tabs-toggle]')
    if (!toggle || !root.contains(toggle)) return

    if (ACTIVATE_KEYS.has(e.key)) {
      e.preventDefault()
      handlers.activate(toggle)
      return
    }

    if (!NAV_KEYS.has(e.key)) return

    const idx = toggles.indexOf(toggle)
    if (idx === -1) return

    let next = idx
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (idx + 1) % toggles.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (idx - 1 + toggles.length) % toggles.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = toggles.length - 1
        break
    }
    if (next !== idx) {
      e.preventDefault()
      toggles[next].focus()
    }
  }

  root.addEventListener('keydown', onKey)
  return () => root.removeEventListener('keydown', onKey)
}
