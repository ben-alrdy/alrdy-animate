import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

const cdnScripts = [
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/SplitText.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/CustomEase.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/Draggable.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/InertiaPlugin.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3/dist/Flip.min.js',
  'https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js',
]

export default defineConfig({
  site: 'https://animate.alrdy.de',
  integrations: [
    starlight({
      title: 'alrdy-animate',
      description: 'Attribute-driven scroll-animation and interactive-component library.',
      customCss: ['./src/styles/custom.css'],
      head: cdnScripts.map((src) => ({
        tag: 'script',
        attrs: { src, defer: true },
      })),
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/ben-alrdy/alrdy-animate',
        },
      ],
      sidebar: [
        { label: 'Getting started', autogenerate: { directory: 'getting-started' } },
        { label: 'Appear animations', autogenerate: { directory: 'animations/appear' } },
        { label: 'Text animations', autogenerate: { directory: 'animations/text' } },
        { label: 'Hover animations', autogenerate: { directory: 'animations/hover' } },
        { label: 'Components', autogenerate: { directory: 'animations/components' } },
        { label: 'Utilities', autogenerate: { directory: 'animations/utilities' } },
        { label: 'Recipes', autogenerate: { directory: 'recipes' } },
      ],
    }),
  ],
})
