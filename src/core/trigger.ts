import type { Breakpoints } from '../types/index'
import { resolveAttrAtWidth, type ValueAttr } from './settings'

export type TriggerKind = 'scroll' | 'event' | 'click' | 'load-once' | 'load' | 'lcp'

export interface ParsedTrigger {
  kind: TriggerKind
  eventName?: string
}

/**
 * Load-timed kinds that fire on *every* init via the paused → load-gate →
 * paint-release path. `load-once` is deliberately excluded — it runs the same
 * gate but only on the first init, so callers gate it separately on
 * `firstInit`. Centralised so adding another load-timed kind (e.g. a future
 * `lcp`-like one) is a single edit instead of a grep across feature modules.
 */
export function isLoadKind(kind: TriggerKind): boolean {
  return kind === 'load' || kind === 'lcp'
}

export const CUSTOM_EVENT_NAME = 'aa:trigger'

// Modal vocabulary lives here (core already encodes the modal-active event and
// the card selector in INFERENCE_CONTAINERS) so the gate (viewport-gate.ts) and
// the modal feature (modal/state.ts) share one definition instead of drifting.
export const MODAL_CARD_SELECTOR = '[aa-modal-name]'
export const MODAL_STATUS_ATTR = 'aa-modal-status'

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
  // `lcp` is a load-timed entrance optimised as the Largest Contentful Paint
  // element: the companion CSS paints it immediately at ~0.01 opacity (an
  // eligible LCP candidate, before the bundle) and the appear feature fades it
  // to full. Timing-wise it behaves like `load` (see triggered-animation.ts).
  if (token === 'lcp') return { kind: 'lcp' }
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
 *
 * `rootSelector` + `enableAttr` let inference skip a container whose feature is
 * responsively disabled (`none`) at the current breakpoint — it never inits, so
 * inheriting its event would strand the inner animation paused forever. Modal
 * has no per-breakpoint disable, so it carries no enable mapping.
 */
const INFERENCE_CONTAINERS: ReadonlyArray<{
  selector: string
  eventName: string
  rootSelector?: string
  enableAttr?: ValueAttr
}> = [
  { selector: MODAL_CARD_SELECTOR, eventName: 'modal-active' },
  { selector: '[aa-tabs-content]', eventName: 'tab-active', rootSelector: '[aa-tabs]', enableAttr: 'aa-tabs' },
  { selector: '[aa-tabs-visual]', eventName: 'tab-active', rootSelector: '[aa-tabs]', enableAttr: 'aa-tabs' },
  { selector: '[aa-slider-item]', eventName: 'slide-active', rootSelector: '[aa-slider]', enableAttr: 'aa-slider' },
  { selector: '[aa-stack-card]', eventName: 'card-active', rootSelector: '[aa-stack]', enableAttr: 'aa-stack' },
]

// True when the container won't ever emit its event, so inference must skip it
// and fall through to the next container (or scroll). Two cases:
//   1. Orphan — the container has a `rootSelector` but no matching ancestor
//      (e.g. a stray `aa-stack-card` left inside a modal with no `aa-stack`).
//      The owning feature never inits on it, so its event never fires; treating
//      it as active would strand the inner animation paused forever.
//   2. Responsively disabled — the owning root resolves to `none` at the current
//      width, so the feature skips it this breakpoint.
// Containers without a `rootSelector` (modal) are always active.
function containerDisabled(
  container: Element,
  def: { rootSelector?: string; enableAttr?: ValueAttr },
  breakpoints: Breakpoints | undefined,
): boolean {
  if (!def.rootSelector) return false
  const root = container.closest(def.rootSelector)
  if (!root) return true
  if (!breakpoints || !def.enableAttr) return false
  const value = resolveAttrAtWidth(root, def.enableAttr, window.innerWidth, breakpoints)
  return value !== undefined && value.trim().split(/\s+/).includes('none')
}

/**
 * Resolve the trigger(s) for an animated element.
 *
 * If the user set `aa-trigger` explicitly, that wins (this is the escape
 * hatch — `aa-trigger="scroll"` forces scroll behavior even inside a
 * container, and explicit values may be a space-separated list). Otherwise,
 * walk up the DOM looking for a known container ancestor and return the
 * matching event trigger. Default is scroll.
 *
 * Pass `breakpoints` so inference can skip a container whose feature is
 * responsively disabled at the current width (e.g. `aa-stack="|none"` on
 * mobile) — without it the inner animation would inherit an event that the
 * disabled feature never emits and never play.
 */
export function resolveTriggers(
  element: Element,
  explicit: string | undefined,
  breakpoints?: Breakpoints,
): ParsedTrigger[] {
  if (explicit !== undefined && explicit.trim() !== '') return parseTriggers(explicit)

  // Find the closest *active* container ancestor across all known patterns. We
  // compute the matched element for each, skip any whose feature is disabled at
  // this breakpoint, then pick the deepest survivor (the one that doesn't
  // contain any of the others).
  let best: { container: Element; eventName: string } | null = null
  for (const def of INFERENCE_CONTAINERS) {
    const match = element.closest(def.selector)
    if (!match) continue
    if (containerDisabled(match, def, breakpoints)) continue
    if (!best || best.container.contains(match)) {
      best = { container: match, eventName: def.eventName }
    }
  }

  if (best) return [{ kind: 'event', eventName: best.eventName }]
  return [{ kind: 'scroll' }]
}

export function resolveTrigger(
  element: Element,
  explicit: string | undefined,
  breakpoints?: Breakpoints,
): ParsedTrigger {
  return resolveTriggers(element, explicit, breakpoints)[0]
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
