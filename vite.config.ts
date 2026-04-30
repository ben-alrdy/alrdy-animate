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

export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/core/index.ts'),
      name: 'AlrdyAnimate',
      fileName: (format) => (format === 'es' ? 'alrdy-animate.js' : 'alrdy-animate.umd.cjs'),
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: externalIds,
      output: {
        globals: { ...gsapGlobals, lenis: 'Lenis' },
        chunkFileNames: 'features/[name].js',
      },
    },
  },
})
