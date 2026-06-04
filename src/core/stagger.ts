import type { ResolvedOptions } from '../types/index'

type StaggerFrom = 'start' | 'end' | 'center' | 'edges'

/**
 * Resolve the default stagger for a given split mode. Stagger is the lone
 * timing default that varies per mode — chars cascade fast, lines cascade
 * slow. `undefined` covers aa-children without a split (e.g. scroll feature
 * staggering a card grid) and falls back to the `default` slot.
 */
export function defaultStaggerFor(
  splitMode: 'chars' | 'words' | 'lines' | undefined,
  options: ResolvedOptions,
): number {
  if (splitMode === 'chars') return options.stagger.chars
  if (splitMode === 'words') return options.stagger.words
  if (splitMode === 'lines') return options.stagger.lines
  return options.stagger.default
}

export interface StaggerFlags {
  from: StaggerFrom
  random: boolean
  groupSize: number
  grid: boolean
}

export interface StaggerSpec {
  unit: number
  line: number
  flags: StaggerFlags
}

export type StaggerValue =
  | number
  | Record<string, unknown>
  | ((index: number, target: Element, list: Element[]) => number)

const VALID_FROM = new Set<StaggerFrom>(['start', 'center', 'end', 'edges'])

const defaultFlags = (): StaggerFlags => ({
  from: 'start',
  random: false,
  groupSize: 1,
  grid: false,
})

/**
 * `aa-stagger` value grammar:
 *   - First numeric token = unit stagger (per element)
 *   - Second numeric token = line stagger (used by line-grouped text modes
 *     only). When omitted it falls back to `lineFallback` (the caller passes
 *     the `lines` default), independent of the unit stagger.
 *   - Non-numeric tokens are flags applied to the unit stagger:
 *       start | center | end | edges        — origin (default: start)
 *       random | random:N                   — random; optional batch size N
 *       grid                                — auto-detect 2D layout
 *   - `random:N` shuffles every element to a random rank, then groups them in
 *     batches of N — so each batch is N elements scattered across the set,
 *     not N consecutive ones.
 *   - random + grid/origin is meaningless: random wins.
 */
export function parseStaggerSpec(
  value: string | undefined,
  fallback: number,
  lineFallback: number = fallback,
): StaggerSpec {
  const flags = defaultFlags()
  if (!value) {
    return { unit: fallback, line: lineFallback, flags }
  }
  const tokens = value.trim().split(/\s+/)
  const numerics: number[] = []
  for (const token of tokens) {
    if (/^-?\d/.test(token)) {
      const n = parseFloat(token)
      if (Number.isFinite(n)) numerics.push(n)
      continue
    }
    if (VALID_FROM.has(token as StaggerFrom)) {
      flags.from = token as StaggerFrom
    } else if (token === 'random') {
      flags.random = true
    } else if (token.startsWith('random:')) {
      flags.random = true
      const n = parseInt(token.slice('random:'.length), 10)
      if (Number.isFinite(n) && n > 0) flags.groupSize = n
    } else if (token === 'grid') {
      flags.grid = true
    }
  }
  const unit = numerics[0] ?? fallback
  const line = numerics[1] ?? lineFallback
  return { unit, line, flags }
}

export function buildStagger(unit: number, flags: StaggerFlags): StaggerValue {
  if (flags.random) {
    // groupSize ≤ 1: GSAP's native random distribution gives the same result.
    if (flags.groupSize <= 1) {
      return { each: unit, from: 'random' }
    }
    // Scattered random batches: shuffle every element to a random rank, then
    // group by `floor(rank / groupSize)`. Each batch is N random elements
    // (not N adjacent ones) and batches fire in time order. Ranks are cached
    // on first invocation so every element keeps a stable assignment.
    const groupSize = flags.groupSize
    let ranks: number[] | null = null
    return (index: number, _target: Element, list: Element[]) => {
      if (!ranks) {
        const r = Array.from({ length: list.length }, (_, i) => i)
        for (let k = r.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1))
          ;[r[k], r[j]] = [r[j], r[k]]
        }
        ranks = r
      }
      return Math.floor((ranks[index] ?? 0) / groupSize) * unit
    }
  }
  if (flags.grid || flags.from !== 'start') {
    const out: Record<string, unknown> = { each: unit, from: flags.from }
    if (flags.grid) out.grid = 'auto'
    return out
  }
  return unit
}
