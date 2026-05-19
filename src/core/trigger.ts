export type TriggerKind = 'scroll' | 'event' | 'click' | 'load-once' | 'load'

export interface ParsedTrigger {
  kind: TriggerKind
  eventName?: string
}

export const CUSTOM_EVENT_NAME = 'aa:trigger'

/**
 * Multiplier applied to event-triggered animations on reverse, so the
 * exit feels snappier than the entrance (matches v7's 2× reverse).
 * Forward = 1, reverse = `REVERSE_TIME_SCALE`. Consumers reset to 1 on
 * forward so the scale doesn't leak between cycles.
 */
export const REVERSE_TIME_SCALE = 2

/**
 * Ease curve used on reverse via GSAP 3.15's `easeReverse`. A flat curve
 * keeps exits clean — without it, eases like `anticipate`/`bounce` play
 * their dip/overshoot at the END of the reverse, which reads as a glitch.
 */
export const REVERSE_EASE = 'power2.inOut'

function parseOne(token: string): ParsedTrigger | null {
  if (token === 'scroll') return { kind: 'scroll' }
  if (token === 'click') return { kind: 'click' }
  if (token === 'load-once') return { kind: 'load-once' }
  if (token === 'load') return { kind: 'load' }
  if (token.startsWith('event:')) {
    return { kind: 'event', eventName: token.slice('event:'.length) }
  }
  return null
}

/**
 * Parse `aa-trigger` into one or more ParsedTriggers. Multiple values are
 * space-separated, e.g. `aa-trigger="load event:enter"` means "fire on the
 * very first init via load, then on every subsequent `aa:trigger` event with
 * `detail.name === 'enter'` thereafter." See feature implementations for how
 * the combination is resolved (load owns the first init cycle; non-load
 * triggers wire on subsequent inits).
 */
export function parseTriggers(value: string | undefined): ParsedTrigger[] {
  if (!value) return [{ kind: 'scroll' }]
  const trimmed = value.trim()
  if (trimmed === '') return [{ kind: 'scroll' }]
  const parts = trimmed.split(/\s+/)
  const triggers: ParsedTrigger[] = []
  for (const part of parts) {
    const parsed = parseOne(part)
    if (parsed) triggers.push(parsed)
  }
  return triggers.length > 0 ? triggers : [{ kind: 'scroll' }]
}

export function parseTrigger(value: string | undefined): ParsedTrigger {
  return parseTriggers(value)[0]
}

/**
 * Containers that auto-emit lifecycle events on their items. An animation
 * inside one of these inherits the matching event trigger unless it sets an
 * explicit `aa-trigger` value.
 *
 * Order matters: the *closest* match wins, which is the right call for nested
 * components (e.g. tabs inside a slider — tab-active beats slide-active
 * because it's closer to the animated element).
 */
const INFERENCE_CONTAINERS: ReadonlyArray<{ selector: string; eventName: string }> = [
  { selector: '[aa-modal-name]', eventName: 'modal-active' },
  { selector: '[aa-tabs-content]', eventName: 'tab-active' },
  { selector: '[aa-tabs-visual]', eventName: 'tab-active' },
  { selector: '[aa-slider-item]', eventName: 'slide-active' },
  { selector: '[aa-stack-card]', eventName: 'card-active' },
]

/**
 * Resolve the trigger(s) for an animated element.
 *
 * If the user set `aa-trigger` explicitly, that wins (this is the escape
 * hatch — `aa-trigger="scroll"` forces scroll behavior even inside a
 * container, and explicit values may be a space-separated list). Otherwise,
 * walk up the DOM looking for a known container ancestor and return the
 * matching event trigger. Default is scroll.
 */
export function resolveTriggers(
  element: Element,
  explicit: string | undefined,
): ParsedTrigger[] {
  if (explicit !== undefined && explicit.trim() !== '') return parseTriggers(explicit)

  // Find the closest container ancestor across all known patterns. We compute
  // the matched element for each, then pick the deepest (the one that doesn't
  // contain any of the others).
  let best: { container: Element; eventName: string } | null = null
  for (const { selector, eventName } of INFERENCE_CONTAINERS) {
    const match = element.closest(selector)
    if (!match) continue
    if (!best || best.container.contains(match)) {
      best = { container: match, eventName }
    }
  }

  if (best) return [{ kind: 'event', eventName: best.eventName }]
  return [{ kind: 'scroll' }]
}

export function resolveTrigger(element: Element, explicit: string | undefined): ParsedTrigger {
  return resolveTriggers(element, explicit)[0]
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

/**
 * Names ending in `-active` pair with the same name ending in `-inactive` for
 * reverse. e.g. `slide-active` ↔ `slide-inactive`. Returning null means no
 * paired reverse event.
 */
export function pairedReverseName(eventName: string): string | null {
  return eventName.endsWith('-active')
    ? eventName.slice(0, -'-active'.length) + '-inactive'
    : null
}

export interface PairedTriggerHandlers {
  element: Element
  forwardName: string
  onForward: () => void
  onReverse?: () => void
}

/**
 * Subscribe to a forward event and (when the name ends in `-active`) the
 * matching `-inactive` reverse event. Filters by element ancestry so animations
 * only react to events emitted on themselves or an ancestor.
 */
export function subscribeWithPair({
  element,
  forwardName,
  onForward,
  onReverse,
}: PairedTriggerHandlers): () => void {
  const reverseName = onReverse ? pairedReverseName(forwardName) : null
  return onCustomTrigger((target, name) => {
    if (target !== element && !target.contains(element)) return
    if (name === forwardName) onForward()
    else if (reverseName && name === reverseName && onReverse) onReverse()
  })
}
