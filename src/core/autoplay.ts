import type { AutoplayOptions } from '../types/index'

export interface ParsedAutoplay {
  enabled: boolean
  interval: number
  hoverPause: boolean
  /** `hover-slow` token — marquee-only (slider/tabs ignore it). */
  hoverSlow: boolean
}

/**
 * Parse `aa-autoplay`.
 * Presence of the attribute (even empty: `<div aa-autoplay>`) enables autoplay.
 * Tokens:
 *   <number>     — interval/duration in seconds (overrides the default)
 *   hover-pause  — pause cycling while the user hovers the root
 *   hover-slow   — (marquee) ramp the loop down while hovering
 *   none         — opt out (e.g. `aa-autoplay="4|none"` to disable on small screens)
 *
 * `intervalDefault` lets a caller override the fallback seconds (marquee passes
 * 40, its cruise default); when omitted, `defaults.interval` is used.
 */
export function parseAutoplay(
  raw: string | undefined,
  defaults: AutoplayOptions,
  attrPresent: boolean,
  intervalDefault?: number,
): ParsedAutoplay {
  const baseInterval = intervalDefault ?? defaults.interval
  const fallback: ParsedAutoplay = {
    enabled: false,
    interval: baseInterval,
    hoverPause: defaults.hoverPause,
    hoverSlow: false,
  }
  if (!attrPresent) return fallback

  const tokens = (raw ?? '').trim().split(/\s+/).filter(Boolean)
  if (tokens.includes('none')) return fallback

  let interval = baseInterval
  let hoverPause = defaults.hoverPause
  let hoverSlow = false
  for (const t of tokens) {
    if (t === 'hover-pause') hoverPause = true
    else if (t === 'hover-slow') hoverSlow = true
    else {
      const n = parseFloat(t)
      if (Number.isFinite(n) && n > 0) interval = n
    }
  }
  return { enabled: true, interval, hoverPause, hoverSlow }
}
