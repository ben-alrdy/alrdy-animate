/**
 * Shared attribute-value parsers used by every feature module.
 *
 * Each helper here was previously inlined in 7–11 places (see PR history).
 * Centralizing them keeps the parse contract — particularly the "empty string
 * or 'true' counts as truthy" rule for scrub — identical across features.
 */

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
