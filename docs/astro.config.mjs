import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://animate.alrdy.de',
  integrations: [
    starlight({
      title: 'alrdy-animate',
      description: 'Attribute-driven scroll-animation and interactive-component library.',
      customCss: ['./src/styles/custom.css'],
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
        { label: 'Interactive', autogenerate: { directory: 'animations/interactive' } },
        { label: 'Utilities', autogenerate: { directory: 'animations/utilities' } },
      ],
    }),
  ],
})
