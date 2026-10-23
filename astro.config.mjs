import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'cpo3',
      sidebar: [
        { label: 'Overview', slug: 'index' },
        { label: 'Getting started', slug: 'getting-started' },
        { label: 'Reference', slug: 'reference' },
      ],
    }),
  ],
});
