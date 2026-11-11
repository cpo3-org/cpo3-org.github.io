import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'cpo3',
      components: { SiteTitle: './src/components/SiteTitle.astro' },
      customCss: ['./src/styles/theme.css'],
      expressiveCode: {
        useStarlightUiThemeColors: false,
        styleOverrides: {
          borderRadius: 'var(--cpo3-radius)',
          borderColor: 'var(--cpo3-code-border)',
          codeBackground: 'var(--cpo3-code-bg)',
          frames: {
            frameBoxShadowCssValue: 'none',
            editorBackground: 'var(--cpo3-code-bg)',
            editorTabBarBackground: 'var(--cpo3-code-header)',
            editorTabBarBorderBottomColor: 'var(--cpo3-code-border)',
            editorActiveTabBackground: 'var(--cpo3-code-bg)',
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
      sidebar: [
        { label: 'Overview', slug: 'index' },
        { label: 'Getting started', slug: 'getting-started' },
        { label: 'Reference', slug: 'reference' },
      ],
    }),
  ],
});
