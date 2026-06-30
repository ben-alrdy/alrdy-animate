/**
 * Shared attribute-value parsers used by every feature module.
 *
 * Each helper here was previously inlined in 7–11 places (see PR history).
 * Centralizing them keeps the parse contract — particularly the "empty string
 * or 'true' counts as truthy" rule for scrub — identical across features.
 */

import type { ResolvedOptions } from '../types/index'
import { resolveScrollStart } from './scroll-trigger'
import type { Config } from './settings'

export function parseNum(value: string | null | undefined, fallback: number): number {
  if (value === undefined || value === null) return fallback
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Parse an `aa-scrub` attribute value.
 *
 * Returns:
 *   - `undefined` — attribute absent (caller decides default behaviour)
 *   - `true`      — attribute present without value, `"true"`, or non-numeric
 *   - `number`    — explicit scrub lag in seconds (e.g. `aa-scrub="0.5"`)
 *
 * Note: parallax treats absent as "scrubbed by default" — that callsite should
 * fall back with `parseScrub(value) ?? true`.
 */
export function parseScrub(
  value: string | null | undefined,
): number | true | undefined {
  if (value === undefined || value === null) return undefined
  if (value === '' || value === 'true') return true
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : true
}

/**
 * Parse a boolean `aa-*` flag that overrides a global `init()` default.
 *   - absent (null/undefined) → `fallback` (the global default)
 *   - `"false"`               → `false`
 *   - present otherwise (`""`, `"true"`, any value) → `true`
 */
export function parseBool(
  value: string | null | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined || value === null) return fallback
  return value !== 'false'
}

/**
 * Resolve an `aa-anchor` selector to the element that should anchor the
 * ScrollTrigger. Falls back to the animating element itself when no selector
 * is given or no match is found, so a malformed anchor never breaks the page.
 */
export function resolveAnchor(element: Element, anchor: string | undefined): Element {
  if (!anchor) return element
  const root = element.closest(anchor)
  if (root) return root
  const found = document.querySelector(anchor)
  return found ?? element
}

const ANIMATE_ATTRS = [
  'aa-animate',
  'aa-animate-sm',
  'aa-animate-md',
  'aa-animate-lg',
  'aa-animate-xl',
] as const

/**
 * True when the element carries any `aa-animate*` attribute. Used by tabs +
 * modal to detect "author wrapped their own entrance animation on this
 * panel/card" — when true, the feature steps out of the way (the author's
 * animation owns visibility) instead of running its default cross-fade.
 */
export function hasAnimateAttribute(el: Element | null): boolean {
  if (!el) return false
  for (const attr of ANIMATE_ATTRS) {
    if (el.hasAttribute(attr)) return true
  }
  return false
}

/**
 * Common animation-timing fields read from a resolved per-element `Config`.
 * Centralises the duration / delay / ease / intensity / scroll-start / scroll-end
 * / scrub / again parsing that scroll / text / reveal repeat verbatim. Parallax
 * does its own thing (scrub defaults true, scrollStart/End get `clamp(...)`-
 * wrapped) so it doesn't use this.
 */
export interface AnimationConfig {
  duration: number
  delay: number
  ease: string
  intensity: number
  scrollStart: string
  scrollEnd: string
  scrub: number | true | undefined
  again: boolean
}

export function readAnimationConfig(config: Config, opts: ResolvedOptions): AnimationConfig {
  const scrub = parseScrub(config['aa-scrub'])
  return {
    duration: parseNum(config['aa-duration'], opts.duration),
    delay: parseNum(config['aa-delay'], 0),
    ease: config['aa-ease'] ?? opts.ease,
    intensity: parseNum(config['aa-intensity'], opts.intensity),
    scrollEnd: config['aa-scroll-end'] ?? opts.scrollEnd,
    scrub,
    scrollStart: resolveScrollStart(config['aa-scroll-start'], opts, scrub),
    again: parseBool(config['aa-again'], opts.again),
  }
}
