import type { GsapHandle } from '../core/gsap-detect'

export type SplitMode = 'words' | 'chars' | 'lines'

export interface SplitConfig {
  mode: SplitMode
  /** When set, animation tools should group units by line (e.g. "lines-chars"). */
  groupBy?: 'lines'
  mask: boolean
  /** When set, each split unit gets an inline `--char` / `--word` / `--line` CSS variable (1-based) for CSS-driven stagger. */
  index: boolean
}

export interface SplitResult {
  mode: SplitMode
  words: HTMLElement[]
  chars: HTMLElement[]
  lines: HTMLElement[]
  revert: () => void
}

interface SplitTextOptions {
  type: string
  autoSplit?: boolean
  tag?: string
  linesClass?: string
  wordsClass?: string
  charsClass?: string
  mask?: string
  propIndex?: boolean
  aria?: 'auto' | 'hidden' | 'none'
  onSplit?: (instance: SplitTextInstance) => void
}

// Tags where aria-label is permitted by the ARIA-in-HTML spec. Anything not in
// this set (p, div, span, blockquote, …) gets a sibling sr-only clone instead,
// because aria-label on those tags is flagged by axe/Lighthouse.
const ARIA_LABEL_ALLOWED = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'button', 'label', 'summary',
])

function tagAllowsAriaLabel(el: Element): boolean {
  return ARIA_LABEL_ALLOWED.has(el.tagName.toLowerCase())
}

interface SplitTextInstance {
  words: HTMLElement[]
  chars: HTMLElement[]
  lines: HTMLElement[]
  revert: () => void
}

type SplitTextCtor = new (target: Element | string, opts: SplitTextOptions) => SplitTextInstance

export function parseSplit(value: string | undefined): SplitConfig | null {
  if (!value) return null
  const head = value.split('|')[0].trim().toLowerCase()
  if (!head) return null
  const tokens = head.split(/\s+/)
  const modeToken = tokens[0]
  let mode: SplitMode | null = null
  let groupBy: 'lines' | undefined
  if (modeToken === 'words' || modeToken === 'word') mode = 'words'
  else if (modeToken === 'chars' || modeToken === 'char') mode = 'chars'
  else if (modeToken === 'lines' || modeToken === 'line') mode = 'lines'
  else if (modeToken === 'lines-chars' || modeToken === 'line-chars') {
    mode = 'chars'
    groupBy = 'lines'
  } else if (modeToken === 'lines-words' || modeToken === 'line-words') {
    mode = 'words'
    groupBy = 'lines'
  }
  if (!mode) return null
  const flags = tokens.slice(1)
  const mask = flags.includes('mask')
  const index = flags.includes('index')
  return groupBy ? { mode, groupBy, mask, index } : { mode, mask, index }
}

interface ApplyOptions {
  /** When true, wrap each line in an `overflow: clip` wrapper. Per-char/word masks aren't useful for slide animations — the wrapper would trap the moving unit. */
  mask?: boolean
  /** When true, expose 1-based `--char` / `--word` / `--line` CSS variables on each split unit for CSS-driven stagger. */
  index?: boolean
  /**
   * Called when SplitText auto-re-splits (e.g. the viewport resizes within a
   * breakpoint and line wrapping changes). The original `.aa-char`/`.aa-line`
   * DOM nodes are replaced by fresh ones, so any GSAP tween still pointing at
   * the old nodes silently animates orphaned elements. Callers should use
   * this hook to tear down the previous tween/trigger and rebuild against
   * the new SplitResult.
   *
   * NOT fired on the initial split — use the synchronous return value of
   * `applySplit()` for first-time setup.
   */
  onResplit?: (split: SplitResult) => void
}

export function applySplit(
  element: Element,
  mode: SplitMode,
  gsapHandle: GsapHandle | null,
  opts: ApplyOptions = {},
): SplitResult {
  const SplitTextCtor = gsapHandle?.plugins?.SplitText as SplitTextCtor | undefined
  if (!SplitTextCtor) {
    console.warn('[alrdy-animate] aa-split requires the GSAP SplitText plugin.')
    return { mode, words: [], chars: [], lines: [element as HTMLElement], revert: () => {} }
  }
  // Chars mode keeps 'words' so each word stays an atomic inline-block box that
  // can't break mid-word. Without it, SplitText's line measurement can assign
  // part of a word to one `.aa-line` and the rest to the next (Safari-specific,
  // worsened by mid-text inline-block sub-spans). Char tweens still hit `.aa-char`.
  const type =
    mode === 'lines'
      ? 'lines'
      : mode === 'words'
        ? 'words,lines'
        : 'words,chars,lines'
  const splitOpts: SplitTextOptions = {
    type,
    // span wrappers keep the produced markup spec-valid in any context
    // (`<span>` / `<a>` / `<button>` containers can't legally hold `<div>`).
    // SplitText's default of `tag: "div"` would inline-inject `display:
    // inline-block` / `block`, but we ship those rules in alrdy-animate.css
    // for `.aa-char` / `.aa-word` / `.aa-line` so layout is preserved.
    tag: 'span',
    // autoSplit re-runs SplitText when line wrapping changes (typical case:
    // user resizes the viewport within a breakpoint and the text re-wraps).
    // Without this, lines stay frozen at their original measurements while
    // the underlying text reflows — `text-slide-up`-style line masks would
    // visibly clip or gap. The catch is that auto-resplit replaces the
    // `.aa-char` / `.aa-line` DOM nodes, leaving previously-built GSAP tweens
    // pointing at orphaned elements. The companion `onResplit` hook below
    // wires a callback so the caller can rebuild its animation against the
    // new nodes.
    autoSplit: true,
    linesClass: 'aa-line',
    wordsClass: 'aa-word',
    charsClass: 'aa-char',
  }
  // mask is always line-level: per-char/word masks would trap the moving unit.
  if (opts.mask) splitOpts.mask = 'lines'
  if (opts.index) splitOpts.propIndex = true

  // SplitText's onSplit fires both for the initial split (synchronously inside
  // the constructor) and for every resize-driven re-split. We skip the first
  // call so the caller can keep its existing synchronous setup path using the
  // return value of `applySplit()`. Subsequent calls deliver the new split to
  // `onResplit` for rebuilds.
  if (opts.onResplit) {
    const onResplit = opts.onResplit
    let initialFired = false
    splitOpts.onSplit = (inst) => {
      if (!initialFired) {
        initialFired = true
        return
      }
      onResplit({
        mode,
        words: inst.words ?? [],
        chars: inst.chars ?? [],
        lines: inst.lines ?? [],
        // Re-splits replace the DOM via SplitText itself; the outer revert()
        // captured below handles full teardown. Per-resplit revert is a no-op.
        revert: () => {},
      })
    }
  }

  const allowAriaLabel = tagAllowsAriaLabel(element)
  let srSpan: HTMLSpanElement | null = null
  let priorAriaHidden: string | null = null
  if (allowAriaLabel) {
    splitOpts.aria = 'auto'
  } else {
    splitOpts.aria = 'none'
    priorAriaHidden = element.getAttribute('aria-hidden')
    element.setAttribute('aria-hidden', 'true')
    const text = element.textContent ?? ''
    if (text.trim() && element.parentElement) {
      srSpan = document.createElement('span')
      srSpan.className = 'aa-sr-only'
      srSpan.textContent = text
      element.parentElement.insertBefore(srSpan, element)
    }
  }

  const inst = new SplitTextCtor(element, splitOpts)
  return {
    mode,
    words: inst.words ?? [],
    chars: inst.chars ?? [],
    lines: inst.lines ?? [],
    revert: () => {
      try {
        inst.revert()
      } catch {
        /* already reverted */
      }
      if (srSpan) srSpan.remove()
      if (!allowAriaLabel) {
        if (priorAriaHidden === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', priorAriaHidden)
      }
    },
  }
}
