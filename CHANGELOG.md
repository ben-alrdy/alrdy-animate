# Changelog

All notable changes to **alrdy-animate**. Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow [SemVer](https://semver.org/).

The `latest` dist-tag currently points to **v7.3.5** (the v7 stable). The v8 line lives under the **`alpha`** dist-tag — install with `npm install alrdy-animate@alpha`. v8 will replace `latest` once the API has stabilized for a full beta cycle (see [Unreleased](#unreleased)).

---

## v7 → v8 highlights

If you're on v7 and considering the alpha:

- **Full TypeScript rewrite** built with Vite 7. Strict-mode types ship in `dist/types/`; per-attribute JSDoc surfaces in IDE hovers and AI autocomplete via `import 'alrdy-animate/jsx'`.
- **Attribute prefix is now `aa-`** (no `data-` wrapper). Spec-permissive, matches HTMX precedent.
- **`gsap` and `lenis` are peer dependencies** — never bundled. Webflow users provide them via `<script>` tags; npm users install them alongside.
- **New trigger orchestrator** with `aa-trigger="<kind>"` and combinable values: `load-once`, `load`, `event:<name>`, `click:<name>`, scroll (default). Custom events fire via `dispatchEvent(new CustomEvent('aa:trigger', { detail: { name: ... } }))`.
- **Responsive variants via `|` shorthand and Tailwind-style breakpoint suffixes** (`-sm`, `-md`, `-lg`, `-xl`). Compiles to `gsap.matchMedia` ranges; only one variant runs at once.
- **Lifecycle hooks** (`init({ root })`, `destroy({ keepGlobals })`, `refresh()`, `ready()`) for SPA route changes and page transitions — see the [Webflow + Barba](https://animate.alrdy.de/recipes/webflow-barba/) and [Next.js page transitions](https://animate.alrdy.de/recipes/nextjs-transitions/) recipes.
- **Built-in Lenis smooth scroll** via `init({ smoothScroll: true })` — synced to `gsap.ticker`, instance exposed at `window.lenis`. ScrollToPlugin is no longer needed.
- **Reduced-motion + mobile-optimization options** built into init; decorative features auto-drop to fade fallbacks based on `prefers-reduced-motion` or small viewports.
- **`AGENTS.md` shipped in the package root** as a single-file reference for AI coding assistants (Claude Code, Cursor, Aider) — they can read it from `node_modules/alrdy-animate/` without web-fetching docs.

What v8 doesn't have yet: **Pin** animations (rebuild planned in v8.x), form-submit handler (dropped), templates/theme registry (dropped). Lazy-loaded images delegate to native `loading="lazy"`.

---

## [Unreleased]

Path to **v8.0.0** stable:

1. **`8.0.0-beta.1`** — API freeze. Only bugfixes and doc polish until the beta cycle is clean. Includes:
   - Migration guide (`docs/installation/v7-to-v8.mdx`).
   - Production validation in real Webflow + Next.js projects.
2. **`8.0.0-rc.1`** — last-call release candidate.
3. **`8.0.0`** promoted to `latest`.

---

## [8.0.0-alpha.7] — 2026-05-17

### Added
- **Next.js page transitions example** at `examples/nextjs-transition/`. Runnable Next 15 App Router demo of GSAP-driven page transitions where the leaving AND incoming pages are both visible during the transition (Osmo Supply's stacked-cards effect), wired into the lib's `init`/`destroy` lifecycle. (`ad6698b`)
- **Next.js page transitions recipe** at [`/recipes/nextjs-transitions/`](https://animate.alrdy.de/recipes/nextjs-transitions/). Covers the leave-before-push / enter-after-push state machine, the snapshot + handoff pattern, viewport prefetch via `<Link>`, and the gotchas around React's atomic route swap. (`5a92743`)
- **`loadDelay` init option** (default `0.1s`). Adds a tunable delay before `load` / `load-once` triggers fire, useful for staggering page-entry animations against custom intro timelines. (`8f77572`)

### Changed
- **`slices` feature split into a standalone module** with direction suffixes and flag syntax (`aa-animate="slices-up"`, `aa-animate="slices-up reverse"`). Previously bundled inside the `reveal` feature. **Breaking** for anyone who used the unprefixed `slices` syntax in alpha.6 — update to use the new direction suffix. (`97f4ff6`)
- Installation docs (`docs/installation/nextjs.mdx`) now link to the new transitions recipe and include a decision table for `aa-trigger="load"` vs `aa-trigger="load-once event:enter"` based on whether you're running a visual transition.

### Fixed
- `easeReverse` now emitted as a top-level tween property (not a timeline default). This makes per-tween reverse easing actually take effect on event-triggered exits. (`23ceeeb`)

### Chore
- `.gitignore` covers `examples/*/.next`, `next-env.d.ts`, `tsconfig.tsbuildinfo` so future Next.js examples don't track build cache. (`da468ad`)

---

## [8.0.0-alpha.6] — 2026-05-15

### Changed
- **Trigger orchestration lifted out of feature modules** into `src/core/trigger.ts`. Features now declare their trigger intent; the orchestrator handles event/click/scroll wiring uniformly. Also fixes a SplitText resize bug. (`3acb98e`)
- **Load triggers renamed**: `aa-trigger="page-enter"` is now `aa-trigger="load-once"`; the always-fires variant is now `aa-trigger="load"`. Old names continue to work as aliases for one beta cycle. Shared trigger helpers deduplicated across features. (`14a6fa0`)

---

## [8.0.0-alpha.5] — 2026-05-13

### Added
- **`aa-trigger="page-enter"`** for SPA route-entry animations. Fires after `init()` runs against the new route — designed for elements that should animate every time the user lands on a page, not just on the first visit. (Renamed to `load-once` in alpha.6.) (`cf87024`)

### Fixed
- `destroy({ keepGlobals: true })` now correctly re-attaches `[aa-scroll-target]` and `[aa-toggle-playstate]` listeners on subsequent `init()` calls. Previously, the global observers were preserved (correct) but the per-DOM listener bindings weren't refreshed (bug).

---

## [8.0.0-alpha.4] — 2026-05-12

### Fixed
- `scrubStart` is now honoured by `text`, `reveal`, and the reduced-motion fade-fallback pass. Previously only `scroll` respected it. (`329cadc`)

---

## [8.0.0-alpha.3] — 2026-05-12

### Added
- **Class-based animation presets** via `init({ presets })`. Map CSS class names to virtual `aa-*` attribute sets so designers can apply animations from a style guide without writing attribute syntax. The map is in-memory only — never mutates the DOM. Elements with any explicit `aa-*` attribute still win over their preset. (`c2060f2`)

---

## [8.0.0-alpha.2] — 2026-05-12

### Changed
- **CI publish workflow** now derives the npm dist-tag from the version suffix: `-alpha.N` → `alpha`, `-beta.N` → `beta`, `-rc.N` → `rc`, no suffix → `latest`. Prereleases no longer accidentally promote past v7 on `latest`. (`a26a4d5`)

---

## [8.0.0-alpha.1] — 2026-05-12

### Added
- **`text-scale`, `text-scale-up`, `text-scale-down`** preset family — scaling word-by-word reveals to complement the existing `text-slide` / `text-blur` / `text-fade` set. (`fdd0397`)
- **`aa-cursor-offset`** to override the custom-cursor pointer offset per `[aa-cursor]` element. (`d76a39f`)

### Changed
- **Docs site published to `animate.alrdy.de`** via GitHub Pages. README and `AGENTS.md` link to it; install URLs auto-pin to the package version of the docs build so `<script src="…@VERSION/dist/alrdy-animate.umd.cjs">` snippets stay valid even after the docs site updates. (`4036b1e`, `41693e5`)
- Editorial homepage hero + 3×3 section grid; GSAP / Lenis CDN scripts hoisted to Astro's `head` config so every demo page loads them consistently. (`23f8b84`, `51e7cd9`)
- Hover documentation structure aligned with the appear/text page templates. (`e44f9e5`)

---

## [8.0.0-alpha.0] — 2026-05-11

### Added — Foundation
- **Full TypeScript rewrite** of the library with Vite 7 build pipeline and strict-mode `tsc` declaration emit. Attribute prefix changed from `data-aa-*` to `aa-*`. (`3acb98e` and many)
- **Astro 6 + Starlight 0.38 documentation site** with per-animation pages, live `<Demo>` component, and Pagefind search. (`3f7216c`)
- **`AGENTS.md` shipped in package root** so AI coding agents (Claude Code, Cursor, Aider) get a single-file reference covering attributes, lifecycle, plugin requirements, and recipes — version-pinned via `node_modules/alrdy-animate/AGENTS.md`. Per-attribute JSDoc on `src/types/jsx.d.ts` powers IDE hovers. (`8d75e2c`)
- **`init({ root })` scoped scanning** so SPA route changes can re-init alrdy-animate against just the new subtree (Barba `data-barba="container"`, Next.js swapped `<main>`, etc.). (`9fc0257`)
- **`destroy({ keepGlobals, keepFromStates })`** for clean page-transition leaves. `keepGlobals` preserves Lenis + scroll-state observers across the swap; `keepFromStates` skips `clearProps` on the leaving DOM so un-fired scroll animations don't flash visible during a leave timeline. (`9fc0257`)
- **`ready()` + live `options` snapshot** exposed for outside GSAP scripts that need the same eases / motion preferences alrdy-animate is using. (`ad213d7`)
- **`aa-timeout` universal init-timeout safety layer** — inline `<head>` snippet reveals every `[aa-animate]` element at its natural state if `init()` hasn't fired by a tunable deadline (default 4s). Pairs with the `aa-fallback` CSS-keyframe path for the hero staircase. (`ea2a957`)
- **`init({ reducedMotion, optimizeMobile })`** options. Decorative features auto-drop to fade fallbacks based on `prefers-reduced-motion` or small viewports (gated on `md` breakpoint). (`014f2b4`)

### Added — Features
- **`scroll` (fade/zoom/slide/blur/rotate)** rebuilt around `gsap.fromTo` + ScrollTrigger; supports `aa-children`, `aa-scrub`, and the new responsive shorthand. (`f50bd52`)
- **`text` (text-fade / text-blur / text-slide / text-tilt / text-marker / text-oval / text-rotate / text-block)** with SplitText runtime and split-aware staggering. (`0d56c91`)
- **`reveal` (clip-path inset / circle / oval entrances)**. (`0d56c91`)
- **`slices`** (full-bleed sliced reveals). (`0d56c91`)
- **`parallax`** with `aa-parallax-start` / `aa-parallax-end` overrides. (`dc783dc`)
- **`tabs`** with optional `aa-autoplay` and progress indicator (port of v7's accordion, rebuilt API). (`7d5537b`)
- **`slider`** — draggable carousel using Draggable + InertiaPlugin, with trigger inference and paired events. (`6b22dcb`)
- **`marquee`** — infinite-loop scroller with three-wrapper structure and shipped structural CSS. (`5129d65`)
- **`nav`** — scroll-spy nav with current/hover indicators via Flip. (`21464db`)
- **`hover`** (`hover-bg-block`, colorize-on-hover) + **`cursor`** (custom pointer tracking) — both touch-only-device-aware. (`dc783dc`)
- **`modal`** — fixed-position dialogs with `aa-modal-name`/`-target`/`-close`/`-backdrop` and scroll-lock. (`75fded4`)

### Added — Integrations
- **Lenis smooth scroll** wired into `init({ smoothScroll: true | LenisOptions })`. Instance lives at `window.lenis`, synced to `gsap.ticker`. `aa-scroll-target` clicks delegate through Lenis when present. (`a04e956`, `61fcc52`, `7693599`)
- **Webflow + Barba page-transition recipe** with the lib's lifecycle hooks wired in. Includes the verbatim Osmo stacked-cards timeline + a no-pause pattern for content-reveal animations via `aa:trigger event:enter` dispatched from inside the leave timeline. (`222611b`)
- **`aa-trigger="load"`** + multi-trigger syntax (e.g. `"load-once event:enter"`) + slow-network CSS fallback recipe so heroes don't stay hidden if the bundle is slow. (`98004f9`)

### Added — Defaults
- **GSAP 3.15** custom ease `osmo` + `0.8s` default duration registered automatically by `init()`. (`362509a`, `5a1b3ae`)
- **`easeReverse`** on event-triggered exits using GSAP 3.15's new API. (`362509a`)
- **Centralised timing defaults**, split-aware stagger, **`aa-autoplay`** attribute. (`9db8413`)

### Removed
- **Pin animations** — to be rebuilt from scratch in a v8.x minor.
- **Form-submit feature** (no production use; dropped).
- **Templates / theme registry** (dropped).
- **Lazy-load image handler** — delegate to native `loading="lazy"`.
- **CSS-only animations / IntersectionObserver `.in-view`** path — all animations now GSAP-driven. The shipped CSS file only carries split-utility classes and a reduced-motion safety net.

---

## v7 and earlier

See the [v7-maintenance](https://github.com/ben-alrdy/alrdy-animate/tree/v7-maintenance) branch for v7 patches. v7's stable line continues at `latest` until v8 promotes.
