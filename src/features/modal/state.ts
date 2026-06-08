import { MODAL_STATUS_ATTR } from '../../core/trigger'

export { MODAL_STATUS_ATTR }
export const MODAL_GROUP_STATUS_ATTR = 'aa-modal-group-status'

export interface ModalEntry {
  name: string
  card: HTMLElement
}

export interface ModalState {
  group: HTMLElement
  entries: ModalEntry[]
  byName: Map<string, ModalEntry>
  backdrop: HTMLElement | null
  isActive: (entry: ModalEntry) => boolean
  setStatus: (entry: ModalEntry, status: 'active' | 'not-active') => void
  setGroupStatus: (status: 'active' | 'not-active') => void
  activeEntry: () => ModalEntry | null
}

export function createModalState(group: HTMLElement): ModalState {
  const cards = Array.from(group.querySelectorAll<HTMLElement>('[aa-modal-name]'))
  const entries: ModalEntry[] = []
  const byName = new Map<string, ModalEntry>()
  for (const card of cards) {
    const name = card.getAttribute('aa-modal-name')
    if (!name) continue
    const entry: ModalEntry = { name, card }
    entries.push(entry)
    byName.set(name, entry)
  }

  // First [aa-modal-backdrop] inside the group; backdrop is optional.
  const backdrop = group.querySelector<HTMLElement>('[aa-modal-backdrop]')

  const isActive = (entry: ModalEntry): boolean =>
    entry.card.getAttribute(MODAL_STATUS_ATTR) === 'active'

  const setStatus = (entry: ModalEntry, status: 'active' | 'not-active'): void => {
    entry.card.setAttribute(MODAL_STATUS_ATTR, status)
  }

  const setGroupStatus = (status: 'active' | 'not-active'): void => {
    group.setAttribute(MODAL_GROUP_STATUS_ATTR, status)
    // Drive the group's own visibility inline so users don't need custom CSS
    // keyed on the status attribute. visibility (not display) keeps the cards
    // measurable for SplitText; a child card's own visibility:visible on open
    // overrides this hidden parent, so the active card still shows.
    group.style.visibility = status === 'active' ? 'visible' : 'hidden'
  }

  const activeEntry = (): ModalEntry | null => entries.find(isActive) ?? null

  return { group, entries, byName, backdrop, isActive, setStatus, setGroupStatus, activeEntry }
}
