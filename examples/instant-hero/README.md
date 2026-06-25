# Instant hero example

A tiny two-page site demonstrating `aa-trigger="load-instant"` — hero entrances
that paint on the first frame as pure CSS, before GSAP loads. Navigate between
**Home** and **About** to feel the instant entrance on every page load.

It uses your **local `dist/` build**, so build the library first:

```sh
npm run build          # from the repo root — produces dist/loader.iife.js + dist/alrdy-animate.umd.js
```

Then serve from the **repo root** (the pages reference `/dist/...` with absolute paths):

```sh
python3 -m http.server 8080      # from the repo root
# open http://localhost:8080/examples/instant-hero/
```

## What to try

- **Click Home ⇄ About** repeatedly — the headline + copy animate instantly on
  every navigation, no wait for the bundle.
- **Throttle the network** (DevTools → Network → Slow 3G) and reload. The
  `load-instant` elements still appear immediately; the one element marked with a
  plain `aa-trigger="load"` (on the Home page) visibly lags until GSAP + `init()`
  arrive — that's the difference the feature removes.
- The About headline is **character-split** by `loader.iife.js` (a ~0.9 KB no-GSAP
  splitter) and staggered entirely in CSS.

GSAP is loaded from the jsDelivr CDN; everything else is local.
