# Deployment Guide

Velocity Rush builds to a fully static site (`dist/`) — no server-side runtime, no database, no API keys. It can be hosted anywhere that serves static files over HTTPS (HTTPS is required for the PWA service worker and for some browsers' Web Audio autoplay rules to behave consistently).

## General steps

```bash
npm install
npm run build
# deploy the contents of dist/
```

Because `vite.config.ts` sets `base: './'`, the build uses relative asset paths — it works whether it's served from a domain root (`https://example.com/`) or a subpath (`https://example.com/velocity-rush/`), with no extra configuration.

## Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. No environment variables needed.

`netlify.toml` (optional, if you want it explicit):

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

## Vercel

1. Framework preset: **Vite** (or "Other")
2. Build command: `npm run build`
3. Output directory: `dist`

## GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

(Add `gh-pages` as a dev dependency first: `npm i -D gh-pages`.) If deploying to `https://<user>.github.io/<repo>/`, the relative `base: './'` already handles the subpath correctly — no changes needed.

## Any static file host (S3, Cloudflare Pages, Firebase Hosting, nginx, etc.)

Just upload/serve the contents of `dist/` as-is. Recommended response headers:

- `Cache-Control: no-cache` on `index.html` and `sw.js` (so PWA updates are picked up promptly)
- `Cache-Control: public, max-age=31536000, immutable` on the hashed files under `assets/` (they're content-hashed by Vite, so this is always safe)

## PWA notes

`vite-plugin-pwa` generates `sw.js` and `manifest.webmanifest` at build time with `registerType: 'autoUpdate'` — the service worker registration script is auto-injected into `index.html`, so there's nothing extra to wire up. Users who visit over HTTPS will get an "Install app" prompt (browser-dependent) and the game will work offline after the first load.

## Post-deploy checklist

1. Open the deployed URL and confirm the "Tap or press any key to start" prompt appears (confirms JS loaded and boot succeeded).
2. Play a Quick Race through to the Results screen (confirms physics/audio/save all work in the deployed environment).
3. Reload the page and confirm your coins/level persisted (confirms `localStorage` isn't being blocked by the host's headers/CSP).
4. Check the browser console for errors — there should be none.
