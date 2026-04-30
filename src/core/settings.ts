import type { Breakpoints } from '../types/index'

export const VALUE_BEARING_ATTRS = [
  'aa-animate',
  'aa-trigger',
  'aa-split',
  'aa-stagger',
  'aa-duration',
  'aa-delay',
  'aa-ease',
  'aa-distance',
  'aa-scroll-start',
  'aa-scroll-end',
  'aa-scrub',
  'aa-anchor',
  'aa-parallax-start',
  'aa-parallax-end',
] as const

export type ValueAttr = (typeof VALUE_BEARING_ATTRS)[number]

export const SUFFIX_KEYS: Array<keyof Breakpoints> = ['sm', 'md', 'lg', 'xl']

export type BucketKey = 'base' | keyof Breakpoints | 'reduce'

export type Config = Partial<Record<ValueAttr, string>>

export interface ResolvedAttrs {
  buckets: Map<BucketKey, Config>
}

export function readAttrs(el: Element): ResolvedAttrs {
  const buckets = new Map<BucketKey, Config>()
  const bucket = (k: BucketKey): Config => {
    let b = buckets.get(k)
    if (!b) {
      b = {}
      buckets.set(k, b)
    }
    return b
  }

  for (const attr of VALUE_BEARING_ATTRS) {
    const baseValue = el.getAttribute(attr)
    if (baseValue !== null) {
      const parts = baseValue.split('|')
      if (parts.length === 2) {
        bucket('base')[attr] = parts[1].trim()
        bucket('md')[attr] = parts[0].trim()
      } else {
        bucket('base')[attr] = baseValue
      }
    }
    for (const bp of SUFFIX_KEYS) {
      const v = el.getAttribute(`${attr}-${bp}`)
      if (v !== null) bucket(bp)[attr] = v
    }
  }

  return { buckets }
}

export interface ResolvedRange {
  /** Human-readable bucket name for debugging. */
  bucket: BucketKey
  query: string
  config: Config
}

const RANGE_ORDER = ['base', 'sm', 'md', 'lg', 'xl'] as const
type RangeKey = (typeof RANGE_ORDER)[number]

const ACCUM_KEYS: Record<RangeKey, BucketKey[]> = {
  base: ['base'],
  sm: ['base', 'sm'],
  md: ['base', 'sm', 'md'],
  lg: ['base', 'sm', 'md', 'lg'],
  xl: ['base', 'sm', 'md', 'lg', 'xl'],
}

function configsEqual(a: Config, b: Config): boolean {
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (a[k as ValueAttr] !== b[k as ValueAttr]) return false
  }
  return true
}

function buildRangeQuery(from: number, to: number): string {
  if (from <= 0 && to === Infinity) return 'all'
  if (from <= 0) return `(max-width: ${to - 0.02}px)`
  if (to === Infinity) return `(min-width: ${from}px)`
  return `(min-width: ${from}px) and (max-width: ${to - 0.02}px)`
}

/**
 * Compute exclusive width-based ranges with their layered configs, then merge
 * adjacent ranges that resolve to the same config. Reduced motion is added as
 * an orthogonal entry on top of the base config.
 */
export function resolveRanges(
  buckets: Map<BucketKey, Config>,
  breakpoints: Breakpoints,
): ResolvedRange[] {
  const ranges: Array<{ key: RangeKey; from: number; to: number }> = [
    { key: 'base', from: 0, to: breakpoints.sm },
    { key: 'sm', from: breakpoints.sm, to: breakpoints.md },
    { key: 'md', from: breakpoints.md, to: breakpoints.lg },
    { key: 'lg', from: breakpoints.lg, to: breakpoints.xl },
    { key: 'xl', from: breakpoints.xl, to: Infinity },
  ]

  const perRange = ranges.map((r) => {
    const merged: Config = {}
    for (const k of ACCUM_KEYS[r.key]) {
      const b = buckets.get(k)
      if (b) Object.assign(merged, b)
    }
    return { ...r, config: merged }
  })

  const groups: Array<{ key: RangeKey; from: number; to: number; config: Config }> = []
  for (const r of perRange) {
    const last = groups[groups.length - 1]
    if (last && configsEqual(last.config, r.config)) {
      last.to = r.to
    } else {
      groups.push({ ...r, config: { ...r.config } })
    }
  }

  const result: ResolvedRange[] = groups.map((g) => ({
    bucket: g.key,
    query: buildRangeQuery(g.from, g.to),
    config: g.config,
  }))

  const reduceBucket = buckets.get('reduce')
  if (reduceBucket) {
    const baseBucket = buckets.get('base') ?? {}
    result.push({
      bucket: 'reduce',
      query: '(prefers-reduced-motion: reduce)',
      config: { ...baseBucket, ...reduceBucket },
    })
  }

  return result
}
