# Osmo Button 032 — split-char hover shine

Based on [Osmo Supply's Button 032](https://www.osmo.supply/). The original ships a per-component GSAP `SplitText` init script; this recipe drops that script and uses alrdy-animate's `aa-split="chars index"` attribute instead. If your Webflow site already runs `AlrdyAnimate.init()`, the button works as soon as it's on the page — no extra JavaScript needed.

Text-only variant. The icon-aware index-offset branch of Osmo's original script isn't included.

## Files

| File           | What it is                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `copy.html`    | Open this file in **Chrome** (double-click it). Click **Copy to Webflow** — the page writes the `@webflow/XscpData` envelope to your clipboard with the dual MIME types Webflow's paste handler needs. Then paste in Webflow Designer. |
| `styles.html`  | `<style>…</style>` block — paste into **Project Settings → Custom Code → Head**. Adds the variables, pseudo-elements, transitions, and hover/focus media query that Webflow's Designer can't author. |
| `markup.html`  | Plain HTML alternative for the Embed-widget path (if you don't want native Webflow elements).       |

## Prerequisites

The site must have alrdy-animate + GSAP + SplitText loaded once globally and be running `AlrdyAnimate.init()`. See [`../README.md`](../README.md) for the boilerplate.

## Why a `copy.html` file instead of a raw `.json`

Webflow's Designer paste handler reads `clipboardData.getData('application/json')`. Plain Cmd-C of a JSON text file only fills the `text/plain` slot — so Webflow sees an "empty" clipboard and refuses to paste. The only reliable way to fill `application/json` from the browser is `document.execCommand('copy')` + `clipboardData.setData()` inside a real user-gesture handler. That's what `copy.html` does (same pattern as Osmo's own `.dash-copy-webflow` button and [karenrebecag/Code-to-Webflow](https://github.com/karenrebecag/Code-to-Webflow)).

## Installation — recommended (native Webflow elements)

1. **Open `copy.html`** in Chrome (or any Chromium browser). Just double-clicking the file works; it loads from `file://`.
2. Click the **Copy to Webflow** button. You'll see "Copied! Switch to Webflow Designer and paste".
3. Switch to the Webflow Designer. Click on the canvas where the button should land and **paste** (Cmd/Ctrl + V). Webflow recognises the envelope and reconstructs:
   - A Link Block with class `button-032` and the custom attribute `data-button-032`.
   - Three nested spans: `button-032__bg`, `button-032__inner`, and inside `__inner` the `button-032__text` span with custom attributes `data-button-032-text` and **`aa-split="chars index"`**.
4. Open **Project Settings → Custom Code → Head Code** and paste the contents of `styles.html`. Save and re-publish.
5. The button renders with the default white pill + red shine. Edit the label text in the Designer; the split + hover wiring picks it up on every page reload.

> **Heads-up:** if pasting fails with "clipboard is empty", you probably opened `copy.html` in Safari/Firefox or you have the same Webflow project open in two tabs (known clipboard-state bug). Use Chrome with a single Webflow tab.

## Installation — alternative (Embed widget)

If you prefer not to maintain native Designer elements (e.g. for a one-off page), use `markup.html`:

1. Drag a Webflow **Embed** element onto the page.
2. Paste the contents of `markup.html` into it.
3. Either paste `styles.html` into the same Embed (above the markup) or into **Project Settings → Custom Code → Head** so every Embed on the site shares it.

## Element structure (for reference)

| Element                     | Class              | Custom attributes                                                |
| --------------------------- | ------------------ | ---------------------------------------------------------------- |
| Link Block                  | `button-032`       | `data-button-032` (name only, value blank)                       |
| Span (1st child)            | `button-032__bg`   | —                                                                |
| Span (2nd child)            | `button-032__inner`| —                                                                |
| Span (inside `__inner`)     | `button-032__text` | `data-button-032-text` *(name only)*, `aa-split` = `chars index` |

## Units note (EM vs REM)

EM is preserved throughout. The button is designed to scale with its inherited font-size — padding on `.button-032__inner`, `border-radius`, the `translate: 0 -1.1em 0` hover step, and the `text-shadow: 0 1.1em` shine offset all depend on EM for that scaling. Convert any of them to REM and the button stops sliding the right distance at non-default font sizes (the shine no longer hides exactly one line-height below the baseline, the characters no longer slide exactly one line up).

The one value where REM would be safe is `--button-032-focus-inset: -0.125em` (the focus-outline offset, which doesn't need to scale with text). It's left as EM here for consistency, but flip it to REM if your project enforces no-EM. Same goes for the `box-shadow: 0 0 0 0.125em` width in the focus ruleset.

## Editing padding

Padding lives directly on the `.button-032__inner` class in the Webflow JSON, not behind a CSS variable — so you can change it from the Designer's style panel like any normal class. The default `0.75em 1em` matches Osmo's original; bump it in the Designer to make the button taller/wider site-wide, or add a combo class for a single instance. Border-radius is the opposite case: still a variable (`--button-032-border-radius`), because the `.button-032__bg` pill and the `.button-032::after` focus ring both read it and must stay in sync.

## Variants (per-button overrides)

Override any custom property on a single button (or a parent wrapper) without touching the global CSS:

```css
.button-032[data-theme='secondary'] {
  --button-032-color-background: #6840FF;
  --button-032-color: #fff;
}
```

Add `data-theme="secondary"` as a custom attribute on the Link Block in the Designer.

## Hover from a parent element

The CSS includes a `[data-hover]:is(:hover, :focus-visible) .button-032 …` branch — so if you put `data-hover` on any parent element (a card, list item, wrapper), hovering that parent triggers the button's hover animation too.

```html
<div data-hover class="feature-card">
  …
  <a class="button-032" data-button-032 href="#">…</a>
</div>
```

## How this differs from Osmo's bundle

- **No per-component JavaScript.** Osmo's snippet runs `new SplitText(text, { type: 'chars', charsClass: 'button-032__split-char', propIndex: true })` for each button on `DOMContentLoaded` + `document.fonts.ready`. alrdy-animate's `aa-split="chars index"` does the same work, already waits for `document.fonts.ready`, re-splits on viewport resize, and cleans up on `destroy()`.
- **JSON payload delta.** The clipboard JSON is byte-identical to Osmo's official paste *except* that the text span's `attributes` array gains one entry: `{"name":"aa-split","value":"chars index"}`. Every class ID, node ID, and `styleLess` value is preserved.
- **CSS selector delta.** `.button-032__split-char` references rewritten to `.button-032 .aa-char` (the class the library uses for split characters; not customisable).
- **Icon selectors removed.** `.button-032__icon-outer`, `.button-032__icon`, and the icon hover branch are dropped (text-only recipe).
- **`--button-032-index-offset` kept at its default of `1`.** Osmo's script flips this to `0` when an icon is present so the stagger starts at the icon. With no icon, the default `1` is exactly what `calc((var(--char) - var(--button-032-index-offset)) * 0.024s)` needs to produce a 0-based stagger for the first character.

## How the split actually happens

When `AlrdyAnimate.init()` runs, it scans the DOM for any element with `aa-split`. For each match it calls into GSAP's SplitText with this configuration:

- `type: 'chars'` (from the `chars` token)
- `tag: 'span'`, `charsClass: 'aa-char'`, `linesClass: 'aa-line'` (library defaults)
- `propIndex: true` (from the `index` flag → sets `--char: 1`, `--char: 2`, …)
- `autoSplit: true` (re-splits if the line count changes during viewport resize)

The resulting DOM inside `.button-032__text` looks like:

```html
<span class="button-032__text" aa-split="chars index" data-button-032-text>
  <span class="aa-line">
    <span class="aa-char" style="--char: 1;">B</span>
    <span class="aa-char" style="--char: 2;">u</span>
    <span class="aa-char" style="--char: 3;">t</span>
    <span class="aa-char" style="--char: 4;">t</span>
    <span class="aa-char" style="--char: 5;">o</span>
    <span class="aa-char" style="--char: 6;">n</span>
  </span>
</span>
```

The hover CSS uses `var(--char) - var(--button-032-index-offset)` as the per-character stagger key.

## Accessibility

- Built-in `:focus-visible` outline (`box-shadow: 0 0 0 0.125em var(--button-032-color-focus)`) — make sure `--button-032-color-focus` contrasts with the surrounding background.
- The hover animation is gated behind `@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`, so users with reduced-motion enabled or touch-only devices see the resting state with no per-character animation.
- alrdy-animate inserts a screen-reader-only fallback text node when splitting non-semantic tags, so the button label still reads correctly to assistive tech.
