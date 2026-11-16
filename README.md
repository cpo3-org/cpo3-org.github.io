# cpo3 documentation

The [cpo3 project website](https://cpo3-org.github.io/site/), built with
[Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## Local preview

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal, normally `http://127.0.0.1:4321/site/`.

## Build

```sh
npm run build
npm run preview
```

The static site is written to `dist/`.

## Publishing

GitHub Actions builds pull requests and deploys pushes to `main` to GitHub Pages.
The deployment can also be started manually from the Actions tab. Pages uses
GitHub Actions as its publishing source; generated files are not committed.

## Editing

Pages live in `src/content/docs/`. Add Markdown files there and update the
sidebar in `astro.config.mjs`. Internal page and public asset links must include
the `/site/` base path. The site uses Starlight search and a custom theme;
no API generation is configured.
