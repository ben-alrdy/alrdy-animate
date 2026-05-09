export type Edge = 'top' | 'bottom' | 'left' | 'right'

export type DirectionMode =
  | 'all'
  | 'vertical'
  | 'horizontal'
  | Edge

const VALID_MODES: ReadonlySet<string> = new Set([
  'all',
  'vertical',
  'horizontal',
  'top',
  'bottom',
  'left',
  'right',
])

export function parseDirectionMode(tokens: Iterable<string>): DirectionMode {
  for (const t of tokens) {
    if (VALID_MODES.has(t)) return t as DirectionMode
  }
  return 'all'
}

export function defaultEdge(mode: DirectionMode): Edge {
  if (mode === 'all' || mode === 'vertical') return 'bottom'
  if (mode === 'horizontal') return 'left'
  return mode
}

export function detectEdge(event: MouseEvent, el: Element, mode: DirectionMode): Edge {
  if (mode === 'top' || mode === 'bottom' || mode === 'left' || mode === 'right') return mode

  const rect = el.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const w = rect.width
  const h = rect.height

  if (mode === 'vertical') return y < h / 2 ? 'top' : 'bottom'
  if (mode === 'horizontal') return x < w / 2 ? 'left' : 'right'

  // 'all' — closest edge to the cursor (Osmo-style 4-direction).
  let edge: Edge = 'top'
  let min = y
  if (h - y < min) {
    edge = 'bottom'
    min = h - y
  }
  if (x < min) {
    edge = 'left'
    min = x
  }
  if (w - x < min) {
    edge = 'right'
  }
  return edge
}
