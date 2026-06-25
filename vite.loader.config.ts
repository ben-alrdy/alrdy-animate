import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Separate build for the instant-hero loader (Tier B of `aa-trigger="load-instant"`).
// It's intentionally NOT part of the main lib build: it has no GSAP/lenis deps,
// must stay tiny, and ships in two shapes —
//   dist/loader.js       (ESM)  → `import 'alrdy-animate/loader'` (npm / bundlers)
//   dist/loader.iife.js  (IIFE) → minified, copy-paste inline <script> for Webflow
// `emptyOutDir: false` so this run appends to the main build's dist rather than
// wiping it (the npm `build` script runs the main build first).
export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/loader/index.ts'),
      name: 'AlrdyLoader',
      formats: ['es', 'iife'],
      fileName: (format) => (format === 'es' ? 'loader.js' : 'loader.iife.js'),
    },
  },
})
