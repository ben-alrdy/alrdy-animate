# Claude Code instructions

This is the source repo for **alrdy-animate**, an attribute-driven scroll-animation and interactive-component library used by alrdy agency in Webflow projects and recent Next.js client sites. Currently being rebuilt as **v8.0.0-alpha.0**.

## Read this first

The canonical design doc lives outside the repo at **`/Users/ben/.claude/plans/have-a-detailed-look-mellow-salamander.md`**. Read it before making any architectural decision. It covers attribute conventions, the matchMedia-driven responsive system, the trigger orchestrator, the Phase 2–6 roadmap, and what's deliberately out of scope.

## Branches

- **`master`** — v8 line. v8.0.0-alpha.0 development.
- **`v7-maintenance`** — preserves the 7.3.5 tip for any v7 patches. Do not delete.

## Stack and constraints

- **TypeScript** strict, with `verbatimModuleSyntax`, `noUnusedLocals`, `exactOptionalPropertyTypes`. See `tsconfig.json`.
- **Vite 7** for the lib build. Do not bump to Vite 8 until upstream publishes a working `darwin-universal` Rolldown binary — the install fails as of 2026-04.
- **Astro 6 + Starlight 0.38** for the docs site at `docs/`. Requires Node ≥ 22.12.
- **Node 22.22.2 (LTS jod)** is the project's pinned default via `nvm alias default 22.22.2`.
- **GSAP is a peer dependency, never bundled.** Vite config marks `gsap` and `gsap/*` plugins as external. Users provide it via `<script>` tag (Webflow) or `npm install gsap` (Next.js).
- **Webflow's GSAP acquisition made all Club plugins free** (SplitText, Draggable, Inertia, Flip, MorphSVG). Use them freely in feature modules.

## Architecture

```
src/
├── core/           # public init/destroy/refresh + onResize + the orchestrator
│   ├── index.ts            # public API + window.AlrdyAnimate
│   ├── scanner.ts          # finds aa-* elements, classifies feature
│   ├── settings.ts         # parses | shorthand + Tailwind-style breakpoint suffixes
│   ├── match-media.ts      # ResponsiveController wraps gsap.matchMedia
│   ├── registry.ts         # lazy-loads feature modules by name
│   ├── trigger.ts          # scroll vs event:<name> vs click trigger orchestrator
│   ├── resize.ts           # shared debounced resize bus (public via onResize)
│   ├── lifecycle.ts        # cleanup helpers (mm.revert, disposers)
│   ├── gsap-detect.ts      # window.gsap detection + dev-mode warnings
│   └── state.ts            # internal singleton state (initialized, options, breakpoints)
├── features/
│   ├── scroll/index.ts     # fade/zoom/slide/blur via fromTo + ScrollTrigger; supports aa-children + aa-scrub
│   ├── text/index.ts       # text-fade / text-blur / text-slide-* (uses split runtime)
│   ├── reveal/index.ts     # reveal-* (clip-path inset / circle / oval entrances)
│   ├── parallax/index.ts   # parallax / parallax-horizontal — aa-parallax-start/end overrides
│   ├── hover/index.ts      # hover-bg-block (direction-aware bg slide)
│   ├── accordion/index.ts  # stub
│   ├── marquee/index.ts    # stub
│   ├── nav/index.ts        # stub
│   ├── slider/index.ts     # stub
│   └── modal/index.ts      # stub
├── split/index.ts          # standalone aa-split utility (SplitText + regex fallback)
├── css/alrdy-animate.css   # companion stylesheet: split helper classes + reduced-motion
└── types/
    ├── index.ts            # public TS types
    ├── jsx.d.ts            # JSX.IntrinsicElements ambient types for aa-* (for Next.js autocomplete)
    └── css.d.ts            # *.css module declaration for the side-effect import

docs/                       # Astro 6 + Starlight 0.38 site (separate package)
└── src/
    ├── content.config.ts   # Starlight docsLoader + docsSchema
    ├── content/docs/       # MDX pages: index, 404, getting-started/, animations/
    └── components/Demo.astro  # iframe-style demo wrapper, loads alrdy-animate from file:..

tests/
└── animations/fade-up.spec.ts   # Playwright spec, drives docs dev server
```

## Adding a new feature

Mirror the pattern in `src/features/scroll/index.ts`:

1. Filter `ctx.elements` to those your feature handles.
2. For each element, call `ctx.responsive.bind(element, attrs, ({ config }) => ...)`. The callback runs inside `gsap.matchMedia()` so any `gsap.fromTo` / ScrollTrigger created there is auto-cleaned on breakpoint exit and on `destroy()`.
3. Read `config['aa-…']` for per-attribute options. Fall back to `ctx.options.…` for global defaults.
4. If you need event-based triggering (slider-active, accordion-open, custom), use `parseTrigger(config['aa-trigger'])` + `onCustomTrigger(...)` from `src/core/trigger.ts`. The custom event is `aa:trigger` with `detail.name`.
5. Declare `requiredPlugins: ['ScrollTrigger', 'SplitText', ...]` so the dev-mode warning lists them.

Add a docs page at `docs/src/content/docs/animations/<name>.mdx` and a Playwright spec at `tests/animations/<name>.spec.ts` (use the fade-up spec as a template).

## Commands

```sh
npm run build       # vite build + tsc declaration emit. Outputs dist/.
npm run dev         # vite watch mode
npm run typecheck   # tsc --noEmit (strict pass)
npm run docs:dev    # start Astro Starlight dev server on :4321
npm run docs:build  # build docs (Pagefind search index, sitemap)
npm test            # Playwright runs against docs:dev (auto-starts via webServer config)
npm run test:update # update Playwright snapshots
```

## Visual verification (Phase 2 onwards)

After implementing a feature, drive its docs demo through Playwright MCP (the `mcp__playwright__browser_*` tools) before reporting the task complete:

1. Start `npm run docs:dev` in the background; wait for `astro v6.x.y ready`.
2. `mcp__playwright__browser_navigate` to `http://localhost:4321/animations/<name>/`.
3. `mcp__playwright__browser_console_messages` to confirm the `[alrdy-animate] initialized` log line appears with the expected feature in `Features:` and the right plugins in `Plugins:`.
4. `mcp__playwright__browser_take_screenshot` and/or `_evaluate` to verify the animation runs (e.g. opacity transitions from 0 → 1 after `scrollIntoViewIfNeeded`).
5. Resize to 390×800 and 1280×800 to spot-check the responsive variants.
6. If you can't visually confirm the change, say so explicitly rather than claiming success.

## Conventions

- **Attribute prefix is `aa-`**, not `data-aa-`. Spec-permissive, matches HTMX precedent. Next.js users `import 'alrdy-animate/jsx'` once for autocomplete.
- **Responsive variants**: `|` shorthand splits at `md` (768px). Suffixes (`-sm`, `-md`, `-lg`, `-xl`) follow Tailwind semantics ("at this breakpoint and up"). Both compile to exclusive width ranges in `resolveRanges()`. Only one variant ever runs at once.
- **`none` as a value** opts out at that breakpoint (e.g. `aa-slider="snap|none"`).
- **No JSDoc, no Storybook.** Docs live in `docs/src/content/docs/`. Each animation gets one MDX page with prose + attribute table + live `<Demo>`.
- **Bundle size budget**: core ≤ 5KB gzip; each feature ≤ 5KB gzip; whole UMD ≤ 30KB gzip. Currently 3.82 KB UMD gzip.

## What's deferred

- **Pin** animations (rebuild from scratch in v8.x)
- **Form-submit** feature (no production use; dropped)
- **Templates / theme registry** (dropped)
- **Lazy-load image handler** (delegate to native `loading="lazy"`)
- **CSS-only animations / `.in-view` IntersectionObserver** — dropped. All animations are GSAP-driven; the shipped CSS file only carries split-utility classes and a reduced-motion safety net.
- **Page transitions** are out of scope; `init/destroy/refresh` lifecycle hooks let users wire Barba (Webflow) or View Transitions (Next.js) themselves. Recipes will live in `docs/src/content/docs/recipes/` in Phase 5.

## When in doubt

Read the plan file. If a question isn't answered there or by this CLAUDE.md, surface it to the user (ben@alrdy.de) rather than guessing.
