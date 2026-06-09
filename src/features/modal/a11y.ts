const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const INPUT_SELECTOR = [
  'input:not([disabled]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(',')

function getFocusable(card: HTMLElement): HTMLElement[] {
  return Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  )
}

function getFirstInput(card: HTMLElement): HTMLElement | null {
  return (
    Array.from(card.querySelectorAll<HTMLElement>(INPUT_SELECTOR)).find(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    ) ?? null
  )
}

/**
 * Trap Tab/Shift+Tab focus inside the card. We listen on the card itself, not
 * document, so multiple modals/groups don't fight each other. Returns a
 * disposer that removes the listener.
 */
export function trapFocus(card: HTMLElement): () => void {
  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return
    const focusable = getFocusable(card)
    if (focusable.length === 0) {
      e.preventDefault()
      card.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey) {
      if (active === first || !card.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
  card.addEventListener('keydown', onKeydown)
  return () => card.removeEventListener('keydown', onKeydown)
}

/**
 * Focus the first form input field (input/select/textarea) inside the card,
 * if one exists. We deliberately do NOT auto-focus buttons or links on open —
 * landing focus on a primary/close button invites accidental activation and
 * yanks the viewport. When there's no input to fill, anchor focus on the card
 * itself (tabindex="-1") so the trap has somewhere to start.
 */
export function focusFirst(card: HTMLElement): void {
  const firstInput = getFirstInput(card)
  if (firstInput) {
    firstInput.focus()
    return
  }
  if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1')
  card.focus()
}

/**
 * Document-level Escape listener. Returns a disposer.
 */
export function attachEsc(onEsc: () => void): () => void {
  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') onEsc()
  }
  document.addEventListener('keydown', onKeydown)
  return () => document.removeEventListener('keydown', onKeydown)
}
