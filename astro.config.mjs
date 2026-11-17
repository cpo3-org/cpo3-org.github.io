import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from '@astrojs/markdown-remark';
import { currentVersion, sidebar } from './docs.config.mjs';
import versionLinks from './src/lib/version-links.mjs';

export default defineConfig({
  site: 'https://cpo3-org.github.io',
  base: currentVersion.base || '/',
  outDir: process.env.DOCS_OUT_DIR || './dist',
  cacheDir: `./.astro/${currentVersion.id}`,
  redirects: {
    '/examples/mixed-constraints/': `${currentVersion.base}/getting-started/`,
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, [versionLinks, { base: currentVersion.base }]],
      rehypePlugins: [rehypeKatex],
    }),
  },
  integrations: [
    starlight({
      title: 'cpo3',
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
        SocialIcons: './src/components/SocialIcons.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      customCss: ['./src/styles/theme.css'],
      expressiveCode: {
        useStarlightUiThemeColors: false,
        defaultProps: { frame: 'code' },
        styleOverrides: {
          borderRadius: 'var(--cpo3-radius)',
          borderColor: 'var(--cpo3-code-border)',
          codeBackground: 'var(--cpo3-code-bg)',
          frames: {
            frameBoxShadowCssValue: 'none',
            editorBackground: 'var(--cpo3-code-bg)',
            editorTabBarBackground: 'var(--cpo3-code-header)',
            editorTabBarBorderBottomColor: 'var(--cpo3-code-border)',
            editorActiveTabBackground: 'var(--cpo3-code-header)',
            editorActiveTabForeground: 'var(--sl-color-white)',
            editorActiveTabIndicatorTopColor: 'transparent',
            editorActiveTabIndicatorBottomColor: 'transparent',
            terminalBackground: 'var(--cpo3-code-bg)',
            terminalTitlebarBackground: 'var(--cpo3-code-header)',
            terminalTitlebarForeground: 'var(--sl-color-gray-2)',
            terminalTitlebarBorderBottomColor: 'var(--cpo3-code-border)',
            inlineButtonForeground: 'var(--sl-color-gray-2)',
          },
        },
      },
      sidebar,
    }),
  ],
});
