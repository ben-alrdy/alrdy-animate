import type { AutoplayOptions } from '../types/index'

export interface ParsedAutoplay {
  enabled: boolean
  interval: number
  hoverPause: boolean
}

/**
 * Parse `aa-autoplay`.
 * Presence of the attribute (even empty: `<div aa-autoplay>`) enables autoplay.
 * Tokens:
 *   <number>     — interval in seconds (overrides init default)
 *   hover-pause  — pause cycling while the user hovers the root
 *   none         — opt out (e.g. `aa-autoplay="4|none"` to disable on small screens)
 */
export function parseAutoplay(
  raw: string | undefined,
  defaults: AutoplayOptions,
  attrPresent: boolean,
): ParsedAutoplay {
  const fallback: ParsedAutoplay = {
    enabled: false,
    interval: defaults.interval,
    hoverPause: defaults.hoverPause,
  }
  if (!attrPresent) return fallback

  const tokens = (raw ?? '').trim().split(/\s+/).filter(Boolean)
  if (tokens.includes('none')) return fallback

  let interval = defaults.interval
  let hoverPause = defaults.hoverPause
  for (const t of tokens) {
    if (t === 'hover-pause') hoverPause = true
    else {
      const n = parseFloat(t)
      if (Number.isFinite(n) && n > 0) interval = n
    }
  }
  return { enabled: true, interval, hoverPause }
}
