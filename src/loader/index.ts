/**
 * Instant-hero loader — the optional Tier-B companion to `aa-trigger="instant"`.
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
 * The library's feature setup + reduced-motion pass skip every `instant`
 * element, so nothing here is re-animated. The `--aa-*` it sets and the
 * `aa-instant-split` marker are read only by the inline CSS.
 *
 * The actual keyframe + reveal rules live in the inline `<head>` snippet (see
 * the "Instant hero" recipe), not in this module — they must be present at first
 * paint, which the non-blocking dist stylesheet can't guarantee.
 */
import { splitLite } from './split-lite'

const SELECTOR = '[aa-trigger~="instant"][aa-animate]'

// text-* animations the loader can render instantly via a char split. Line-based
// text effects (slide / tilt / oval / rotate / block / marker) need font+layout
// metrics, so they fall through to the element-level fade here.
const CHAR_TEXT = /^text-(fade|blur|scale)/

// Named eases that have a CSS cubic-bezier equivalent (the `--aa-ease-*` vars in
// the inline snippet). GSAP-only eases (elastic/bounce/power*) aren't expressible
// in CSS, so `aa-ease` on an instant element is limited to these (or a raw CSS
// timing function); anything else is passed through and falls back if invalid.
const CSS_EASES = new Set([
  'osmo', 'energy', 'smooth', 'punch', 'relaxed', 'jump', 'pop', 'anticipate', 'fade',
])

const processed: WeakSet<Element> = new WeakSet()

function num(value: string | null): number {
  const n = value == null ? NaN : parseFloat(value)
  return Number.isFinite(n) ? n : NaN
}

function process(el: HTMLElement): void {
  const animate = (el.getAttribute('aa-animate') ?? '').split('|')[0].trim()
  if (!animate) return

  // Staircase: CSS can't read attr() into a <time>, so set the custom props here.
  // Everything else about the motion (from-state distance/blur, stagger, ease)
  // lives in the inline CSS keyed off `aa-animate` — same as the element-level
  // entrance — so it's all editable in one place. The loader only splits the
  // text and sets `--char`; it does NOT bake in any from-state.
  const delay = num(el.getAttribute('aa-delay'))
  if (delay > 0) el.style.setProperty('--aa-load-delay', `${delay}s`)
  const dur = num(el.getAttribute('aa-duration'))
  if (dur > 0) el.style.setProperty('--aa-load-dur', `${dur}s`)
  const ease = (el.getAttribute('aa-ease') ?? '').trim()
  if (ease) el.style.setProperty('--aa-load-ease', CSS_EASES.has(ease) ? `var(--aa-ease-${ease})` : ease)

  // Char split only for char/word text on a plain-text element (nested markup
  // would be destroyed). `aa-instant-split` switches the CSS from the
  // element-level entrance to the per-char one.
  if (/^text-/.test(animate) && CHAR_TEXT.test(animate) && el.children.length === 0) {
    if (splitLite(el, 'chars')) {
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
 * Process hero elements the moment they parse, before `DOMContentLoaded` / the
 * library's `init()` runs. A `MutationObserver` fires as a microtask between
 * the parser's chunks, so it wins the race even on a fast load where the whole
 * document parses in a single task (rAF polling loses there — `init()` sets
 * `aa-loaded` before the next frame, and splitting after that would mangle an
 * already-revealed hero, so we stop on `aa-loaded`).
 */
function run(): void {
  if (typeof document === 'undefined') return
  scan()
  if (
    document.documentElement.hasAttribute('aa-loaded') ||
    document.readyState !== 'loading'
  ) {
    return
  }
  const obs = new MutationObserver(() => {
    if (document.documentElement.hasAttribute('aa-loaded')) {
      obs.disconnect()
      return
    }
    scan()
  })
  obs.observe(document.documentElement, { childList: true, subtree: true })
  // Final sweep once parsing completes, then stop observing.
  document.addEventListener('DOMContentLoaded', () => {
    scan()
    obs.disconnect()
  }, { once: true })
}

run()
