# Build Instructions

## Development build

```bash
npm run dev
```

Starts Vite's dev server with hot module replacement on `http://localhost:5173`.

## Type checking

```bash
npm run typecheck
```

Runs the TypeScript compiler in `--noEmit` mode against the strict `tsconfig.json`. This project ships with zero type errors — treat any new error as a build blocker.

## Production build

```bash
npm run build
```

This runs `tsc --noEmit` (fails fast on type errors) followed by `vite build`. Output is written to `dist/`:

```
dist/
  index.html
  assets/index-<hash>.js     # single bundled + minified game script
  manifest.webmanifest       # PWA manifest (generated)
  sw.js                      # PWA service worker (generated)
  icons/                     # app icons
```

The whole game — engine, all 20 cars, all 15 tracks, every scene, all audio synthesis — bundles into one JS file (~1.6 MB unminified / ~390 KB gzipped as of this writing), most of which is the Phaser framework itself. There are no image or audio assets to bundle separately.

## Previewing the production build locally

```bash
npm run build
npm run preview   # serves dist/ on http://localhost:4173
```

Always sanity-check with `preview` before deploying — it serves the real built files the same way a static host would, unlike `dev` which serves unbundled source.

## Build configuration

- **`vite.config.ts`** — build target (`es2020`), source maps, and the `vite-plugin-pwa` configuration (manifest + service worker generation).
- **`tsconfig.json`** — strict TypeScript configuration with the `@/*` path alias mapped to `src/*`.

## Continuous Integration

Any CI runner just needs Node 18.18+ and:

```bash
npm ci
npm run build
```

A non-zero exit code means either a type error or a Vite build failure — both are real, actionable failures (no flaky steps in this pipeline).
