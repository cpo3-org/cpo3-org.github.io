# cpo3 documentation

A minimal [Starlight](https://starlight.astro.build/) site for cpo3.
This repository is local only; no GitHub repository or deployment is configured.

## Local preview

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal, normally `http://127.0.0.1:4321`.

## Build

```sh
npm run build
npm run preview
```

The static site is written to `dist/`.

## Editing

Pages live in `src/content/docs/`. Add Markdown files there and update the
sidebar in `astro.config.mjs`. The site uses Starlight's default appearance
and search; no API generation is configured.
