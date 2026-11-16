import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { currentVersion, sourcePath } from '../docs.config.mjs';

export const collections = {
  docs: defineCollection({
    loader: glob({ base: sourcePath(currentVersion, 'docs'), pattern: '**/[^_]*.{md,mdx}' }),
    schema: docsSchema(),
  }),
};
