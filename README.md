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

## Deployment

Pushing to `main` triggers the GitHub Actions workflow that lints, builds, and
deploys to GitHub Pages.
