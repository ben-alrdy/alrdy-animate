import { SUFFIX_KEYS, VALUE_BEARING_ATTRS } from './settings'

export type PresetEntry = string | Record<string, string>
export type PresetMap = Record<string, PresetEntry>

export type ResolvedPreset = Map<string, string>

const VALID_BARE_KEYS = (() => {
  const out = new Set<string>()
  for (const attr of VALUE_BEARING_ATTRS) {
    const bare = attr.slice(3)
    out.add(bare)
    for (const bp of SUFFIX_KEYS) out.add(`${bare}-${bp}`)
  }
  return out
})()

const ANIMATE_KEYS = (() => {
  const out = ['aa-animate']
  for (const bp of SUFFIX_KEYS) out.push(`aa-animate-${bp}`)
  return out
})()

function normalise(value: PresetEntry, warnUnknown?: (key: string) => void): ResolvedPreset {
  const out: ResolvedPreset = new Map()
  if (typeof value === 'string') {
    out.set('aa-animate', value)
    return out
  }
  for (const [bareKey, v] of Object.entries(value)) {
    if (!VALID_BARE_KEYS.has(bareKey)) {
      warnUnknown?.(bareKey)
      continue
    }
    if (v == null) continue
    out.set(`aa-${bareKey}`, String(v))
  }
  return out
}

function hasAnyAaAttr(el: Element): boolean {
  for (const name of el.getAttributeNames()) {
    if (name.startsWith('aa-')) return true
  }
  return false
}

function hasAnimate(resolved: ResolvedPreset): boolean {
  for (const k of ANIMATE_KEYS) {
    if (resolved.has(k)) return true
  }
  return false
}

export function resolvePresets(
  root: ParentNode,
  presets: PresetMap | undefined,
  debug = false,
): Map<Element, ResolvedPreset> {
  const result = new Map<Element, ResolvedPreset>()
  if (!presets) return result

  const seenUnknown = new Set<string>()
  const warnUnknown = debug
    ? (key: string) => {
        if (seenUnknown.has(key)) return
        seenUnknown.add(key)
        console.warn(
          `[alrdy-animate] preset key "${key}" is not a known aa-* attribute — ignored. Valid keys: ${[...VALID_BARE_KEYS].sort().join(', ')}`,
        )
      }
    : undefined

  for (const [className, value] of Object.entries(presets)) {
    const resolved = normalise(value, warnUnknown)
    if (resolved.size === 0) continue
    if (!hasAnimate(resolved)) {
      if (debug) {
        console.warn(
          `[alrdy-animate] preset "${className}" has no "animate" (or per-breakpoint variant) — skipped. Presets must include an aa-animate value.`,
        )
      }
      continue
    }
    let selector: string
    try {
      selector = '.' + CSS.escape(className)
    } catch {
      continue
    }
    let matched = 0
    for (const el of root.querySelectorAll(selector)) {
      if (result.has(el)) continue
      if (hasAnyAaAttr(el)) continue
      result.set(el, resolved)
      matched++
    }
    if (debug && matched === 0) {
      console.warn(`[alrdy-animate] preset "${className}" matched 0 elements.`)
    }
  }
  return result
}

export function resolveAnimateValue(
  el: Element,
  presetMap: Map<Element, ResolvedPreset>,
): string | null {
  return el.getAttribute('aa-animate') ?? presetMap.get(el)?.get('aa-animate') ?? null
}

/**
 * Match an element against a predicate over its `aa-animate` value (and the
 * `-sm/-md/-lg/-xl` variants), consulting the preset map when the real
 * attribute is absent. Used by every feature's `elementMatches()` to decide
 * which elements in `ctx.elements` it owns.
 */
export function matchAnimateValue(
  el: Element,
  presetMap: Map<Element, ResolvedPreset>,
  predicate: (value: string) => boolean,
): boolean {
  const preset = presetMap.get(el)
  const base = el.getAttribute('aa-animate') ?? preset?.get('aa-animate') ?? null
  if (base) {
    for (const part of base.split('|')) {
      if (predicate(part.trim())) return true
    }
  }
  for (const bp of SUFFIX_KEYS) {
    const key = `aa-animate-${bp}`
    const v = el.getAttribute(key) ?? preset?.get(key) ?? null
    if (v && predicate(v.trim())) return true
  }
  return false
}
