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
      card.focus({ preventScroll: true })
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
 * itself (tabindex="-1") so the trap has somewhere to start — with
 * `preventScroll` so anchoring a fieldless modal never jumps the page (and
 * never fights a stopped Lenis), and with its focus outline suppressed in CSS
 * (`[aa-modal-name]:focus`) since the card is a non-interactive container, not
 * a control. The first input keeps its default focus so a below-the-fold field
 * in a tall scrollable card still scrolls natively into view.
 */
export function focusFirst(card: HTMLElement): void {
  const firstInput = getFirstInput(card)
  if (firstInput) {
    firstInput.focus()
    return
  }
  if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1')
  card.focus({ preventScroll: true })
}

let titleIdCounter = 0

/**
 * Apply dialog semantics so assistive tech announces the card as a modal
 * dialog and treats the rest of the page as inert. Respects author-set `role`
 * / `aria-modal` / accessible name. When the author hasn't named the dialog,
 * derive an accessible name from the first heading inside it; if there's no
 * heading either, warn (dev only) — `aria-modal` without a name announces as
 * an unlabelled "dialog".
 */
export function applyDialogSemantics(card: HTMLElement, debug: boolean): void {
  if (!card.hasAttribute('role')) card.setAttribute('role', 'dialog')
  if (!card.hasAttribute('aria-modal')) card.setAttribute('aria-modal', 'true')

  if (!card.hasAttribute('aria-label') && !card.hasAttribute('aria-labelledby')) {
    const heading = card.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6')
    if (heading) {
      if (!heading.id) heading.id = `aa-modal-title-${(titleIdCounter += 1)}`
      card.setAttribute('aria-labelledby', heading.id)
    } else if (debug) {
      console.warn(
        '[alrdy-animate] modal has no accessible name — add an `aria-label` to the [aa-modal-name] element (or a heading inside it) so screen readers can announce the dialog.',
      )
    }
  }
}

/**
 * Mark the controls that open these modals with `aria-haspopup="dialog"` so
 * assistive tech announces that activating them opens a dialog. Triggers are
 * click-delegated and may live anywhere in the document, so match by name.
 */
export function markDialogTriggers(names: Set<string>): void {
  if (typeof document === 'undefined') return
  for (const trigger of document.querySelectorAll<HTMLElement>('[aa-modal-target]')) {
    const name = trigger.getAttribute('aa-modal-target')
    if (name && names.has(name) && !trigger.hasAttribute('aria-haspopup')) {
      trigger.setAttribute('aria-haspopup', 'dialog')
    }
  }
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
