# Vert — Currency Converter

Vert is an installable, offline-capable PWA for converting between currencies,
with rates from [openexchangerates.org](https://openexchangerates.org), built
with Vite, React, and MUI, and deployed to GitHub Pages.

## Requirements

Node.js 22.18 or later. `.nvmrc` pins the version CI uses (26, the current
LTS), so `nvm use` or `fnm use` selects it.

## Setup

Create a `.env` file containing an app ID from
[Open Exchange Rates](https://openexchangerates.org):

```text
OPEN_EXCHANGE_APP_ID=<your app id>
```

## Development

```sh
npm install
npm run dev        # start the dev server
npm run build      # build to dist/
npm run preview    # serve the build locally
```

## Checks

```sh
npm test           # unit tests (Node's built-in test runner)
npm run typecheck  # TypeScript
npm run lint       # Biome formatting and lint check
npm run fix        # apply Biome formatting and safe fixes
```

Tests run TypeScript directly through Node's type stripping, so test files and
everything they import must use `import type` for type-only imports and avoid
TypeScript-only runtime syntax such as enums. The type check enforces both.

## Offline support

`plugins/serviceWorkerPlugin.ts` generates `dist/sw.js` at build time from
`src/serviceWorker.js`, embedding the full list of built files and a content
hash. The service worker precaches the whole build and serves it cache-first, so
the installed app opens instantly with or without a connection. Each deploy
changes `sw.js`, which installs the new build in the background; it takes effect
on the next launch.

Exchange rates are saved locally and used immediately. They are refreshed in the
background after 12 hours, and rates older than 24 hours are still used but
flagged with a dismissible notice.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow that lints, builds, and
deploys to GitHub Pages.
