# Webflow recipes

Paste-ready snippets for popular Webflow components, pre-wired to [alrdy-animate](https://animate.alrdy.de) so you don't need a per-component `<script>` block. Each recipe drops a third-party component (Osmo Supply, etc.) onto a Webflow site that already runs `AlrdyAnimate.init()`, and lets alrdy-animate's attribute API do the wiring the original snippet did with a custom init.

## Prerequisite scripts (load once per Webflow site)

Every recipe in this folder assumes the host site has alrdy-animate + GSAP loaded globally and `AlrdyAnimate.init()` running on `DOMContentLoaded`. Set this up once in **Project Settings → Custom Code** and every recipe just works.

Drop these in **Head Code**:

```html
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/SplitText.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alrdy-animate@8/dist/alrdy-animate.umd.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/alrdy-animate@8/dist/alrdy-animate.css">
```

Drop this in **Footer Code**:

```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    AlrdyAnimate.init({
      debug: false,
      duration: 0.6,
      ease: 'smooth',
      smoothScroll: true,
    });
  });
</script>
```

For the canonical install instructions (alpha-tag pinning, peer plugins beyond SplitText, smooth-scroll options) see <https://animate.alrdy.de/installation/webflow/>.

> **SplitText is still required.** The recipes drop the *per-component* SplitText init, not the plugin itself — alrdy-animate calls into SplitText to handle `aa-split`. Leave the SplitText script in your Head Code.

## Recipes

| Name                                       | What it does                                                                                | Folder                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| Osmo Button 032 — split-char hover shine   | Each character of a button label slides upward with a per-character stagger on hover/focus. | [`osmo-button-032/`](./osmo-button-032/) |

## What each recipe ships

Recipes mirror Osmo's own bundle shape, so the paste workflow is familiar:

| File                        | Purpose                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `copy.html`                 | Open in Chrome, click **Copy to Webflow**, paste in the Designer. The button writes the `@webflow/XscpData` envelope to your clipboard with both `application/json` and `text/plain` MIME types — the format Webflow's paste handler actually reads. Same pattern as Osmo's own "Copy to Webflow" button. |
| `styles.html`               | `<style>…</style>` block. Paste once into **Project Settings → Custom Code → Head** for site-wide use. Adds the variables, pseudo-elements, transitions, and hover media queries that Webflow's Designer can't author. |
| `markup.html` *(optional)*  | Plain HTML alternative for the Embed-widget path when you'd rather not maintain native Designer elements. |

No `*.js` file. That's the whole point — the host site's `AlrdyAnimate.init()` does the work the original Osmo per-component script did.

## Why `copy.html` and not a plain `.json` file

Webflow's Designer reads `clipboardData.getData('application/json')` when you paste. A plain Cmd-C of a JSON file only fills the `text/plain` slot, so Webflow sees an empty clipboard and shows "Clipboard is empty". The only browser-supported way to fill the `application/json` slot is `document.execCommand('copy')` + `clipboardData.setData()` inside a real user-gesture handler — exactly what the `copy.html` button does (and what Osmo's `.dash-copy-webflow` button does on their own site).

## How to use a recipe

1. Open the recipe's `README.md` for any recipe-specific notes (variants, units, attached attributes, etc.).
2. Open `copy.html` in Chrome and click **Copy to Webflow**. Switch to the Webflow Designer and paste (Cmd/Ctrl + V) on the canvas where the element should land.
3. Paste `styles.html` into **Project Settings → Custom Code → Head** (once per project — every instance on the site shares it).
4. Publish.
