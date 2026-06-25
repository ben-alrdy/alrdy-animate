/**
 * Instant-hero loader — the optional Tier-B companion to `aa-trigger="load-instant"`.
 *
 * Runs inline in `<head>` (or via `import 'alrdy-animate/loader'`) *before* the
 * GSAP bundle, so hero entrances paint on the first frame as pure CSS. It does
 * three things, all non-blocking:
 *   1. maps `aa-delay` / `aa-duration` to the `--aa-load-delay` / `--aa-load-dur`
 *      custom properties the inline keyframe reads (the staircase);
 *   2. for char/word `text-*` heroes, splits the text with the no-GSAP
 *      `splitLite` so the CSS char-stagger keyframe can run;
 *   3. for everything else (element-level, or line-based `text-*` that can't be
 *      split pre-font), leaves the element to the element-level CSS reveal rule.
 *
 * The library's feature setup + reduced-motion pass skip every `load-instant`
 * element, so nothing here is re-animated. The `--aa-*` it sets and the
 * `aa-instant-split` marker are read only by the inline CSS.
 *
 * The actual keyframe + reveal rules live in the inline `<head>` snippet (see
 * the "Instant hero" recipe), not in this module — they must be present at first
 * paint, which the non-blocking dist stylesheet can't guarantee.
 */
import { splitLite } from './split-lite'

const SELECTOR = '[aa-trigger~="load-instant"][aa-animate]'

// text-* animations the loader can render instantly via a char split. Line-based
// text effects (slide / tilt / oval / rotate / block / marker) need font+layout
// metrics, so they fall through to the element-level fade here.
const CHAR_TEXT = /^text-(fade|blur|scale)/

const processed: WeakSet<Element> = new WeakSet()

function num(value: string | null): number {
  const n = value == null ? NaN : parseFloat(value)
  return Number.isFinite(n) ? n : NaN
}

// Mirror (loosely) the GSAP text from-states as CSS custom props inherited by
// the `.aa-char` spans. Offsets are in `em` so they scale with the type size.
function setCharFromState(el: HTMLElement, animate: string): void {
  el.style.setProperty('--aa-l-o', '0')
  if (/blur/.test(animate)) el.style.setProperty('--aa-l-b', '8px')
  if (/scale/.test(animate)) el.style.setProperty('--aa-l-s', '0')
  if (/-up$/.test(animate)) el.style.setProperty('--aa-l-y', '0.4em')
  else if (/-down$/.test(animate)) el.style.setProperty('--aa-l-y', '-0.4em')
  else if (/-left$/.test(animate)) el.style.setProperty('--aa-l-x', '0.4em')
  else if (/-right$/.test(animate)) el.style.setProperty('--aa-l-x', '-0.4em')
}

function process(el: HTMLElement): void {
  const animate = (el.getAttribute('aa-animate') ?? '').split('|')[0].trim()
  if (!animate) return

  // Staircase: CSS can't read attr() into a <time>, so set the custom props here.
  const delay = num(el.getAttribute('aa-delay'))
  if (delay > 0) el.style.setProperty('--aa-load-delay', `${delay}s`)
  const dur = num(el.getAttribute('aa-duration'))
  if (dur > 0) el.style.setProperty('--aa-load-dur', `${dur}s`)

  // Char split only for char/word text on a plain-text element (nested markup
  // would be destroyed). `aa-instant-split` switches the CSS from the
  // element-level entrance to the per-char one.
  if (/^text-/.test(animate) && CHAR_TEXT.test(animate) && el.children.length === 0) {
    if (splitLite(el, 'chars')) {
      setCharFromState(el, animate)
      el.setAttribute('aa-instant-split', '')
    }
  }
}

function scan(): void {
  const nodes = document.querySelectorAll<HTMLElement>(SELECTOR)
  for (const el of nodes) {
    if (processed.has(el)) continue
    processed.add(el)
    process(el)
  }
}

/**
 * Poll for hero elements as they parse and process them immediately — the hero
 * is near the top of `<body>` and exists long before `DOMContentLoaded` on a
 * render-blocked page (same rationale as the slow-network fallback snippet).
 * Stop once the library has initialised (`html[aa-loaded]`) or parsing finishes.
 */
function run(): void {
  if (typeof document === 'undefined') return
  // If the bundle already initialised, the lib owns these elements; splitting
  // now would mangle an already-revealed hero. Bail.
  if (document.documentElement.hasAttribute('aa-loaded')) return
  scan()
  if (document.readyState === 'loading') {
    requestAnimationFrame(run)
  }
}

run()
