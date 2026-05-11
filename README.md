# alrdy-animate

Attribute-driven scroll-animation and interactive-component library for Webflow and Next.js. GSAP is loaded externally as a peer dependency.

> **Status: v8.0.0-alpha.** This release is an in-progress rewrite of the v7 line. Public attributes, init options, and feature modules may change between alpha builds. Pin to an exact version for production use. For v7 (the previous stable line), install `alrdy-animate@latest` or see the [`v7-maintenance`](https://github.com/ben-alrdy/alrdy-animate/tree/v7-maintenance) branch.

## Install

**Webflow (CDN, UMD).** Load GSAP (and any plugins you use) first, then alrdy-animate:

```html
<!-- Head -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/alrdy-animate@8.0.0-alpha.0/dist/alrdy-animate.css">

<!-- Before </body> -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/alrdy-animate@8.0.0-alpha.0/dist/alrdy-animate.umd.cjs"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    AlrdyAnimate.init({ ease: 'power2.out', duration: 1 });
  });
</script>
```

Add `aa-animate="fade-up"` (or any other supported attribute) to elements in the Designer.

**Next.js (npm).**

```bash
npm install alrdy-animate@alpha gsap
# optional: smooth scroll
npm install lenis
```

```tsx
'use client';
import { useEffect } from 'react';
import { AlrdyAnimate } from 'alrdy-animate';
import 'alrdy-animate/style';
import 'alrdy-animate/jsx'; // attribute autocomplete on JSX elements

export function AlrdyInit() {
  useEffect(() => {
    AlrdyAnimate.init({ ease: 'power2.out', duration: 1 });
    return () => AlrdyAnimate.destroy();
  }, []);
  return null;
}
```

## Reference

- **[`AGENTS.md`](./AGENTS.md)** — the canonical reference for the public API surface: every `aa-*` attribute, every `InitOptions` field, every feature module, every trigger kind. Designed to be loaded by AI coding agents (Claude Code, Cursor, Aider) in downstream projects.
- **Docs site** — prose guides and live demos at <https://alrdy-animate.com>. Hosted separately from this package; if the site isn't reachable yet, build it locally with `npm run docs:dev`.
- **TypeScript types** — IDE autocomplete and JSDoc hovers via `alrdy-animate/jsx` on JSX elements, and the exported `InitOptions` / `PublicApi` types from the main entry.

## What's in v8

- Strict-TypeScript rewrite with explicit feature modules (`scroll`, `text`, `reveal`, `parallax`, `hover`, `cursor`, `tabs`, `slider`, `marquee`, `nav`, `modal`) and a lazy-loaded registry.
- `gsap.matchMedia` driven responsive system with Tailwind-style breakpoint suffixes (`-sm`, `-md`, `-lg`, `-xl`) and the `|` shorthand for two-breakpoint setups.
- A trigger orchestrator: scroll (default), `event:<name>`, or `click` triggers on any feature.
- GSAP is a peer dependency, never bundled. Webflow's GSAP acquisition made all Club plugins free, so SplitText / Draggable / Inertia / Flip / MorphSVG are available without licensing.
- UMD bundle is ~28 KB gzip with all features included.

For v7 → v8 migration notes and the full feature roadmap, see the docs site (or `docs/src/content/docs/` in this repo).

## License

MIT © Benjamin Brühl
