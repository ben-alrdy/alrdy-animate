export type TriggerKind = 'scroll' | 'event' | 'click'

export interface ParsedTrigger {
  kind: TriggerKind
  eventName?: string
}

export const CUSTOM_EVENT_NAME = 'aa:trigger'

export function parseTrigger(value: string | undefined): ParsedTrigger {
  if (!value) return { kind: 'scroll' }
  const trimmed = value.trim()
  if (trimmed === 'scroll') return { kind: 'scroll' }
  if (trimmed === 'click') return { kind: 'click' }
  if (trimmed.startsWith('event:')) {
    return { kind: 'event', eventName: trimmed.slice('event:'.length) }
  }
  return { kind: 'scroll' }
}

type Listener = (element: Element, eventName: string) => void

const listeners = new Set<Listener>()
let attached = false

function onCustomEvent(e: Event): void {
  if (!(e instanceof CustomEvent) || !e.target) return
  const detail = e.detail as { name?: string } | undefined
  const name = detail?.name
  if (!name) return
  for (const fn of listeners) fn(e.target as Element, name)
}

function ensureAttached(): void {
  if (attached) return
  if (typeof document === 'undefined') return
  document.addEventListener(CUSTOM_EVENT_NAME, onCustomEvent)
  attached = true
}

export function onCustomTrigger(fn: Listener): () => void {
  ensureAttached()
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0 && attached && typeof document !== 'undefined') {
      document.removeEventListener(CUSTOM_EVENT_NAME, onCustomEvent)
      attached = false
    }
  }
}

export function emitTrigger(target: EventTarget, name: string): void {
  target.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: { name }, bubbles: true }))
}
