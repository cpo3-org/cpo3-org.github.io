# cpo3 documentation

The [cpo3 project website](https://cpo3-org.github.io/), built with
[Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## Documentation versions

| URL | Content source |
| --- | --- |
| `/` | Latest release, currently `versions/0.0.1/docs/` |
| `/v0.0.1/` | The same release at a permanent versioned URL |
| `/dev/` | Development docs in `src/content/docs/`, tracking solver `main` |

`docs.config.mjs` lists the releases and selects the latest. Each version is
built independently, with its own navigation, assets, and search index. The
header selector keeps the current page and fragment when that page exists in
the target version; otherwise it opens that version's Overview.

## Local preview

Use Node.js 24 or later and npm. To review **all versions**, including search:

```sh
npm ci
npm run build
npm run preview
```

Open the URL printed in the terminal, normally `http://127.0.0.1:4321/`.
Rebuild after editing to refresh this preview. The combined static site is
written to `dist/`.

For live editing of one version:

```sh
npm run dev                           # Latest release
DOCS_VERSION=dev npm run dev           # Development docs at /dev/
DOCS_VERSION=0.0.1 npm run dev         # Archived release
```

The live dev server serves only the selected version; use the full build and
preview to test version switching and search.

## Editing and releases

Edit development pages in `src/content/docs/` and their navigation in
`src/content/sidebar.json`. Corrections to released documentation go in the
corresponding `versions/<version>/` directory. Each snapshot contains its own
pages and sidebar, so later development changes do not alter older releases.

Write internal links from the root, for example `/settings/`. The build resolves Markdown,
HTML, and MDX links against the selected version. Shared theme and components
apply to all versions. No API generation is configured.

To document a new release:

1. Check the development docs against the solver tag, including API behavior,
   defaults, installation commands, and examples.
2. Copy `src/content/docs/` and `src/content/sidebar.json` into a new
   `versions/<version>/` directory.
3. In the snapshot, replace development wording and Git dependencies with the
   release version/tag, and pin the generated Rust API link to that release.
4. Add the version to `releases` and update `latestRelease` in `docs.config.mjs`.
   Keep earlier snapshots in place so their URLs continue to work.
5. Run `npm test` and `npm run build`, then review switching and search with
   `npm run preview`.

## Publishing

GitHub Actions runs `npm run build` for pull requests and deploys the combined
`dist/` output on pushes to `main`. Deployment can also be started manually
from the Actions tab. Generated files are not committed.
