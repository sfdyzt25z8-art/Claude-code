# CEO Empire

A business simulation game. Start with $10,000, buy and upgrade businesses, hire employees,
invest in stocks/real estate/crypto/startups, ride random market events, and climb the
leaderboard to become the richest CEO in the world.

Built with React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, and Firestore.

## Features

- **Authentication** — email/password sign up & login, password reset, Google sign-in, and a
  no-signup Guest Mode (progress saved to the device via `localStorage`).
- **Dashboard** — cash, net worth, level/XP, reputation, employees, daily profit/expenses, and a
  live net worth chart.
- **10 businesses** (Lemonade Stand through Car Company), each with 5 upgrade tracks
  (Equipment, Marketing, Staff, Technology, Buildings) and employee capacity.
- **5 employee types** (Cashier, Manager, Accountant, Developer, Marketing Specialist) that boost
  income and cut costs when assigned to a business, with extra synergy in matching categories.
- **AI Business Advisor** — a rule-based assistant that recommends what to buy/upgrade next,
  flags understaffed or unprofitable businesses, and explains your daily profit.
- **Random daily events** — Economic Boom, Recession, Viral Marketing, Equipment Failure,
  Investor Opportunity, Tax Refund, New Competitor — each temporarily shifting income/expenses.
- **16 achievements** and an XP/leveling system that unlocks new businesses, hires, and
  investments as you grow.
- **Prestige** — once you reach $5M net worth, reset your empire for a permanent +15%
  (stacking) income boost. Achievements and your daily-reward streak carry over.
- **Sound & music** — synthesized SFX (no audio assets needed) for purchases, upgrades, hires,
  investments, achievements, level-ups, and daily rewards, plus an ambient music toggle.
- **Investments** — stocks, real estate, crypto, and startups with simulated live price
  movement (random walk + drift), buy/sell, and a portfolio view.
- **Leaderboard** — richest players, highest level, biggest company (via Firestore).
- **Statistics** — total profit/expenses, net worth history, net worth composition, and
  profit-by-business charts.
- **Daily rewards** — cash, coins, and XP on a 24h cooldown with a login streak bonus.
- **Settings** — dark/light theme, sound & music toggles.
- **Autosave** — to `localStorage` always, and to Firestore every ~20s when signed in, with an
  offline-progress catch-up (and "welcome back" summary) on return.
- **Installable PWA** — installable to your home screen/dock with its own icon, and the app
  shell (including all game logic) works fully offline after the first load.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · React Router · Firebase
(Auth + Firestore) · Recharts · Framer Motion · lucide-react · vite-plugin-pwa

## Getting started

```bash
npm install
npm run dev
```

The app runs immediately in **Guest Mode** with no configuration — progress is saved to
`localStorage` on the device. To enable real accounts, cloud save, and the leaderboard, set up
Firebase:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** → Email/Password and Google sign-in providers.
3. Enable **Firestore Database**.
4. Copy `.env.example` to `.env.local` and fill in your web app's config values
   (Project Settings → General → Your apps).
5. Restart the dev server.

### Suggested Firestore rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true;               // needed for the public leaderboard
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Deployment

A GitHub Actions workflow (`.github/workflows/ceo-empire-deploy.yml`) builds and deploys this
app to GitHub Pages on every push to `main` that touches `ceo-empire/`, or on demand via the
Actions tab ("Run workflow"). It lints, tests, and builds the app, then publishes `dist/` as the
Pages artifact.

One-time setup (repo admin, on github.com): **Settings → Pages → Source → GitHub Actions**.
After that, pushing to `main` deploys automatically at
`https://<owner>.github.io/<repo>/`.

To deploy with real Firebase accounts/cloud-save/leaderboard instead of Guest Mode only, add
the six `VITE_FIREBASE_*` values (see `.env.example`) as repository secrets — the workflow
already passes them through to the build.

Routing uses `HashRouter` (URLs like `#/dashboard`) and Vite's `base: './'` specifically so the
build works unmodified from any static host or subpath — GitHub Pages, Netlify, Vercel, S3, or
a plain `npm run preview` — with no server-side rewrite rules required.

The production build is also an installable PWA (service worker + manifest via
`vite-plugin-pwa`): visiting the deployed URL offers an install prompt, and the whole app shell
is precached so it keeps working offline after the first visit — verified by loading the app,
going offline, and reloading.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — lint with oxlint
- `npm run test` — run the unit test suite (Vitest)
- `npm run test:watch` — run tests in watch mode

## Project structure

```
src/
  components/    reusable UI (business, employee, investment, dashboard, advisor, layout, ui/)
  contexts/      AuthContext (Firebase auth + guest mode)
  data/          static game config (businesses, upgrades, employees, events, achievements,
                 investments, levels)
  hooks/         useGameSync (load/tick/autosave bridge), useAudioSync
  lib/           game engine, tick/advance logic, market simulation, AI advisor, audio, formatting
                 (*.test.ts files sit next to the modules they cover)
  pages/         route-level screens
  store/         Zustand game store
  types/         shared TypeScript types
```

The game loop treats one in-game "day" as a short real-time window so events, income, and
achievements progress at a satisfying pace during a play session, while the once-per-24h daily
reward uses real wall-clock time.
