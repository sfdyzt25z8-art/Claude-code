# Installation Guide

## Requirements

- [Node.js](https://nodejs.org/) 18.18 or newer (Node 20+ recommended)
- npm 9+ (ships with Node)

No other tools, SDKs, or accounts are required — Velocity Rush has zero external asset dependencies (all graphics and audio are generated at runtime).

## Steps

1. **Clone / copy the project** and move into the `velocity-rush` directory:

   ```bash
   cd velocity-rush
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the dev server**:

   ```bash
   npm run dev
   ```

   Vite will print a local URL (default `http://localhost:5173`). Open it in a modern browser (Chrome, Firefox, Edge, or Safari — desktop or mobile).

4. **Play**: click/tap anywhere on the "Tap or press any key to start" screen to unlock audio (required by browser autoplay policy), then use the main menu.

## Verifying the install

```bash
npm run typecheck   # TypeScript strict-mode check, should report no errors
npm run build        # Full production build (also type-checks first)
```

If `npm run build` completes and produces a `dist/` folder, your install is healthy.

## Troubleshooting

- **Blank page / stuck on "Loading engine…"** — open the browser console. This almost always means a browser extension is blocking `localStorage` or the Web Audio API; try an incognito/private window.
- **No sound** — the game requires a user gesture (click/tap/keypress) before it can start the AudioContext, per browser autoplay policy. The "Tap or press any key to start" screen exists specifically to satisfy this.
- **Port already in use** — pass a different port: `npm run dev -- --port 5174`.
