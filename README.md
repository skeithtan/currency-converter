# Vert — Currency Converter

Vert is an installable, offline-capable PWA for converting between currencies,
with rates from [openexchangerates.org](https://openexchangerates.org), built
with Deno, Vite, React, and MUI, and deployed to GitHub Pages.

## Requirements

Deno 2.x

## Setup

Create a `.env` file containing an app ID from
[Open Exchange Rates](https://openexchangerates.org):

```text
OPEN_EXCHANGE_APP_ID=<your app id>
```

## Development

```sh
deno task dev
deno task build
deno task preview
```

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
