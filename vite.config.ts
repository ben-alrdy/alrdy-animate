import { defineConfig } from 'vite'
import { resolve } from 'node:path'

const gsapGlobals: Record<string, string> = {
  gsap: 'gsap',
  'gsap/ScrollTrigger': 'ScrollTrigger',
  'gsap/SplitText': 'SplitText',
  'gsap/Draggable': 'Draggable',
  'gsap/InertiaPlugin': 'InertiaPlugin',
  'gsap/Flip': 'Flip',
}

const externalIds = [...Object.keys(gsapGlobals), 'lenis']

// Map each module to a stable chunk basename. Without manualChunks, Vite
// assigns anonymous `index.js`, `index2.js`...`indexN.js` chunks (every
// feature's entry file is named `index.ts`, so Rollup can't disambiguate
// from the path alone). The `features/` prefix is added by `chunkFileNames`
// below, so we only return the leaf name here.
//
// CRITICAL: all of `src/core/*` (except the entry, `core/index.ts`) and the
// split runtime go into a single shared chunk. These modules carry singleton
// state — the custom-event listener registry in `core/trigger.ts`, the
// shared resize bus in `core/resize.ts`, the internal `state` object in
// `core/state.ts`. If Rollup duplicates them across feature chunks (which
// it will, given hard chunk boundaries), each duplicate gets its own state
// and cross-feature events silently stop working. Pinning them to one
// shared chunk preserves the singleton.
//
// UMD inlines dynamic imports into a single bundle, so manualChunks is
// rejected by Rollup for that format. We attach this function only to the
// ESM output via the per-format `rollupOptions.output[]` array.
function featureChunk(id: string): string | undefined {
  const featureMatch = id.match(/\/src\/features\/([^/]+)\/index\.[jt]s$/)
  if (featureMatch) return featureMatch[1]
  if (/\/src\/split\/index\.[jt]s$/.test(id)) return 'split'

  // Everything else under src/core (excluding the entry file) and the split
  // runtime become a single shared chunk. Feature chunks import from here
  // instead of inlining their own copy.
  if (
    /\/src\/core\/(?!index\.[jt]s$)/.test(id) ||
    /\/src\/split\/runtime\.[jt]s$/.test(id) ||
    /\/src\/types\//.test(id)
  ) {
    return 'shared'
  }
  return undefined
}

export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    cssCodeSplit: false,
    // `formats` is intentionally omitted — the per-format `rollupOptions.output`
    // array below is the source of truth and would override it.
    lib: {
      entry: resolve(__dirname, 'src/core/index.ts'),
      name: 'AlrdyAnimate',
    },
    rollupOptions: {
      external: externalIds,
      output: [
        {
          format: 'es',
          entryFileNames: 'alrdy-animate.js',
          chunkFileNames: 'features/[name].js',
          manualChunks: featureChunk,
        },
        {
          format: 'umd',
          entryFileNames: 'alrdy-animate.umd.cjs',
          name: 'AlrdyAnimate',
          inlineDynamicImports: true,
          globals: { ...gsapGlobals, lenis: 'Lenis' },
        },
      ],
    },
  },
})
