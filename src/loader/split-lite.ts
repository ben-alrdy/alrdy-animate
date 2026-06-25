/**
 * Pure-DOM char/word splitter for the instant-hero loader — no GSAP, no
 * SplitText. Produces the same `.aa-char` / `.aa-word` markup (plus an
 * `.aa-sr-only` accessibility clone) that the library's shipped CSS already
 * styles, so a CSS keyframe can stagger the units on the first painted frame,
 * before the bundle loads.
 *
 * Line splitting is deliberately NOT supported: line breaks depend on layout +
 * the final webfont, neither known pre-bundle. Line-based effects stay on the
 * GSAP/SplitText path. Operates on plain-text content only — callers must skip
 * elements that contain child elements (nested markup would be destroyed).
 */

export type SplitLiteMode = 'chars' | 'words'

interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>
}

function graphemes(text: string): string[] {
  const Seg = (
    typeof Intl !== 'undefined' ? (Intl as unknown as { Segmenter?: unknown }).Segmenter : undefined
  ) as (new (locales?: string, options?: { granularity: string }) => GraphemeSegmenter) | undefined
  if (Seg) {
    try {
      const seg = new Seg(undefined, { granularity: 'grapheme' })
      return Array.from(seg.segment(text), (s) => s.segment)
    } catch {
      // fall through to code-point split
    }
  }
  return Array.from(text) // code-point fallback (good enough for most scripts)
}

/**
 * Split `element`'s text into `.aa-word` (and, in `'chars'` mode, nested
 * `.aa-char`) spans, each carrying a 1-based `--word` / `--char` custom property
 * for CSS-driven staggers. The split spans go inside an `aria-hidden` container
 * and an `.aa-sr-only` clone of the original text is appended, so screen readers
 * read the intact string while the host keeps its role (e.g. heading).
 *
 * Returns `true` on success, `false` (DOM untouched) when there's nothing to split.
 */
export function splitLite(element: HTMLElement, mode: SplitLiteMode): boolean {
  const original = (element.textContent ?? '').trim()
  if (!original) return false

  // aria-hidden wrapper so AT skips the per-unit spans (otherwise a char split
  // reads as "H, e, l, l, o"); the .aa-sr-only sibling carries the real text.
  const visual = document.createElement('span')
  visual.setAttribute('aria-hidden', 'true')

  let charIndex = 0
  let wordIndex = 0
  // Keep the whitespace chunks (capturing group) so spacing is preserved.
  for (const token of original.split(/(\s+)/)) {
    if (token === '') continue
    if (/^\s+$/.test(token)) {
      visual.appendChild(document.createTextNode(token))
      continue
    }
    const word = document.createElement('span')
    word.className = 'aa-word'
    wordIndex += 1
    word.style.setProperty('--word', String(wordIndex))
    if (mode === 'chars') {
      for (const g of graphemes(token)) {
        const ch = document.createElement('span')
        ch.className = 'aa-char'
        charIndex += 1
        ch.style.setProperty('--char', String(charIndex))
        ch.textContent = g
        word.appendChild(ch)
      }
    } else {
      word.textContent = token
    }
    visual.appendChild(word)
  }

  const sr = document.createElement('span')
  sr.className = 'aa-sr-only'
  sr.textContent = original

  element.textContent = ''
  element.appendChild(visual)
  element.appendChild(sr)
  return true
}
