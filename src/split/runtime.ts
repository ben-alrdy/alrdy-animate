import type { GsapHandle } from '../core/gsap-detect'

export type SplitMode = 'words' | 'chars' | 'lines'

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
  linesClass?: string
  wordsClass?: string
  charsClass?: string
  mask?: string
  aria?: string
}

interface SplitTextInstance {
  words: HTMLElement[]
  chars: HTMLElement[]
  lines: HTMLElement[]
  revert: () => void
}

type SplitTextCtor = new (target: Element | string, opts: SplitTextOptions) => SplitTextInstance

export function parseSplitMode(value: string | undefined): SplitMode | null {
  if (!value) return null
  const head = value.split('|')[0].trim().toLowerCase()
  if (head === 'words' || head === 'word') return 'words'
  if (head === 'chars' || head === 'char') return 'chars'
  if (head === 'lines' || head === 'line') return 'lines'
  return null
}

interface ApplyOptions {
  /** When true, wrap each line in an overflow-clipped wrapper (for slide-up reveals). */
  maskLines?: boolean
}

export function applySplit(
  element: Element,
  mode: SplitMode,
  gsapHandle: GsapHandle | null,
  opts: ApplyOptions = {},
): SplitResult {
  const SplitTextCtor = gsapHandle?.plugins?.SplitText as SplitTextCtor | undefined
  if (SplitTextCtor) {
    const type = mode === 'lines' ? 'lines' : mode === 'words' ? 'words,lines' : 'chars,words,lines'
    const splitOpts: SplitTextOptions = {
      type,
      autoSplit: true,
      linesClass: 'aa-line',
      wordsClass: 'aa-word',
      charsClass: 'aa-char',
    }
    if (opts.maskLines) splitOpts.mask = 'lines'
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
      },
    }
  }
  if (mode === 'lines') {
    console.warn(
      '[alrdy-animate] aa-split="lines" requires the SplitText plugin. Falling back to whole element.',
    )
    return { mode, words: [], chars: [], lines: [element as HTMLElement], revert: () => {} }
  }
  return regexSplit(element, mode)
}

function regexSplit(element: Element, mode: 'words' | 'chars'): SplitResult {
  const originalHtml = element.innerHTML
  const parts: HTMLElement[] = []

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let n: Node | null
  while ((n = walker.nextNode())) textNodes.push(n as Text)

  for (const node of textNodes) {
    const parent = node.parentNode
    if (!parent) continue
    const text = node.nodeValue ?? ''
    const frag = document.createDocumentFragment()
    if (mode === 'words') {
      for (const part of text.split(/(\s+)/)) {
        if (!part) continue
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part))
        } else {
          const span = document.createElement('span')
          span.className = 'aa-word'
          span.textContent = part
          parts.push(span)
          frag.appendChild(span)
        }
      }
    } else {
      for (const ch of text) {
        if (/\s/.test(ch)) {
          frag.appendChild(document.createTextNode(ch))
        } else {
          const span = document.createElement('span')
          span.className = 'aa-char'
          span.textContent = ch
          parts.push(span)
          frag.appendChild(span)
        }
      }
    }
    parent.replaceChild(frag, node)
  }

  return {
    mode,
    words: mode === 'words' ? parts : [],
    chars: mode === 'chars' ? parts : [],
    lines: [],
    revert: () => {
      element.innerHTML = originalHtml
    },
  }
}
