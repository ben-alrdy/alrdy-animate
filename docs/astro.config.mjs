import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import remarkGfm from 'remark-gfm'
import { readFileSync } from 'node:fs'
import { visit } from 'unist-util-visit'

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
)

function remarkInterpolateVersion({ version }) {
  return (tree) => {
    visit(tree, ['code', 'inlineCode'], (node) => {
      if (typeof node.value === 'string' && node.value.includes('{{version}}')) {
        node.value = node.value.replaceAll('{{version}}', version)
      }
    })
  }
}

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
  markdown: {
    // remark-gfm is added explicitly: providing custom `remarkPlugins` here
    // otherwise leaves the MDX pipeline without GFM, so tables render as raw text.
    remarkPlugins: [remarkGfm, [remarkInterpolateVersion, { version }]],
  },
  integrations: [
    starlight({
      title: 'AlrdyAnimate',
      description: `Attribute-driven scroll-animation and interactive-component library — v${version}.`,
      customCss: ['./src/styles/custom.css'],
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
      },
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
        { label: 'Installation', autogenerate: { directory: 'installation' } },
        { label: 'Initialization', collapsed: true, autogenerate: { directory: 'initialization' } },
        { label: 'Appear animations', collapsed: true, autogenerate: { directory: 'animations/appear' } },
        { label: 'Text animations', collapsed: true, autogenerate: { directory: 'animations/text' } },
        { label: 'Hover animations', collapsed: true, autogenerate: { directory: 'animations/hover' } },
        { label: 'Components', collapsed: true, autogenerate: { directory: 'animations/components' } },
        { label: 'Utilities', collapsed: true, autogenerate: { directory: 'animations/utilities' } },
        { label: 'Recipes', collapsed: true, autogenerate: { directory: 'recipes' } },
        { label: 'AI reference', link: '/ai-reference/' },
      ],
    }),
  ],
})
