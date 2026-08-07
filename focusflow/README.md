# FocusFlow

FocusFlow is a modern productivity app for planning your day, tracking goals,
building habits, and staying focused. Create goals, break them into tasks,
organize your day, track habits, run Pomodoro-style focus sessions, review
your stats, and get quick coaching from the built-in AI Coach — all in one
clean, fast interface that works entirely offline.

Everything is stored locally in your browser (`localStorage`) — no account,
no backend, and no network connection required to use the app.

## Features

- **Dashboard** — a daily overview: greeting, today's tasks, progress, current
  goals, habit check-ins, and a live focus timer widget.
- **Tasks** — create, edit, complete, and delete tasks with priority, due
  date, category, and an optional linked goal. Search and filter by status,
  priority, or category.
- **Goals** — set a goal with a deadline, link tasks to it, and watch its
  progress bar fill in automatically as linked tasks are completed.
- **Habits** — track daily habits with a weekly grid, current streak, and
  best streak.
- **Focus** — a Pomodoro-style timer (25 min focus / 5 min break by default,
  configurable) with start/pause/resume/reset/skip and a sound toggle. The
  timer keeps running in the background as you navigate the app.
- **Statistics** — charts for tasks completed, focus minutes, and habit
  completion over the last 7 days, plus stat tiles for goals completed, focus
  sessions, and your current daily streak.
- **AI Coach** — ask things like "What should I work on today?" or "Help me
  organize my tasks." Works out of the box with a local, data-aware fallback;
  optionally connect a real AI provider (see below).
- **Settings** — profile name, light/dark/system theme, notification and
  sound toggles, focus timer durations, sample data loading, and a full data
  reset.

The app is fully responsive: a sidebar on desktop, a bottom navigation bar on
mobile, with dark mode throughout.

## Getting started

### Prerequisites

- Node.js 18.18+ (Node 22 recommended)
- npm

### Install

```bash
cd focusflow
npm install
```

### Run in development

```bash
npm run dev
```

This starts the Vite dev server (default: http://localhost:5173).

### Build for production

```bash
npm run build
```

Output is written to `focusflow/dist/`. Preview the production build
locally with:

```bash
npm run preview
```

### Other scripts

```bash
npm run typecheck   # TypeScript project check, no emit
npm run lint         # oxlint
```

## Project structure

```
focusflow/
├── src/
│   ├── components/
│   │   ├── layout/       # Sidebar, bottom nav, app shell
│   │   ├── ui/            # Button, Card, Modal, Toast, form controls, etc.
│   │   ├── tasks/         # Task list item, create/edit form modal
│   │   ├── goals/         # Goal card, create/edit form modal
│   │   ├── habits/        # Habit card, icon picker, create/edit form modal
│   │   ├── focus/         # Animated timer ring
│   │   ├── statistics/    # Stat tile
│   │   └── settings/      # Confirm modal
│   ├── pages/              # One file per route (Dashboard, Tasks, Goals, …)
│   ├── store/              # Zustand stores: app data, focus timer, toasts
│   ├── lib/                 # Pure helpers: dates, ids, storage, derived
│   │                        # stats, sample data, AI coach service, sound
│   ├── hooks/               # useTheme
│   └── types/               # Shared TypeScript interfaces
├── index.html
├── vite.config.ts
└── package.json
```

### Data layer

All `localStorage` reads/writes go through `src/lib/storage.ts`, which
handles unavailable storage (e.g. private browsing) and corrupted JSON
without crashing the app. The main app state (tasks, goals, habits, focus
sessions, settings, AI chat history) lives in a single Zustand store
(`src/store/useAppStore.ts`) persisted through that storage layer, with a
`merge` step that sanitizes anything malformed on load. The Pomodoro timer
runs in its own store (`src/store/useFocusTimerStore.ts`) so it keeps ticking
in the background as you move between pages.

## Environment variables

The AI Coach works fully offline by default — see `src/lib/aiCoach.ts` for
the local, rule-based fallback that reads your real tasks/goals/habits to
give suggestions.

To connect a real AI provider instead, copy `.env.example` to `.env` and set:

| Variable          | Description                                               |
| ------------------ | ----------------------------------------------------------- |
| `VITE_AI_API_KEY` | API key for your AI provider. Leave unset to use the local fallback. |
| `VITE_AI_MODEL`   | Optional model override (defaults to `claude-sonnet-5`).   |

```bash
cp .env.example .env
# then edit .env
```

Restart `npm run dev` after changing `.env` — Vite only reads env files at
startup.

**Never commit a real `.env` file or hard-code an API key in source.**
`.env` is already git-ignored.

### Adding a real AI API

`src/lib/aiCoach.ts` is the single integration point. `callAIProvider()`
already contains a working example call to the Anthropic Messages API using
`VITE_AI_API_KEY`/`VITE_AI_MODEL`. To use a different provider, adjust that
function's request/response handling — the rest of the app (the AI Coach
page, the chat state) doesn't need to change. If you'd rather not expose an
API key in a client bundle, proxy the request through your own backend and
point `callAIProvider()` at that instead.

## Browser support

Any evergreen browser (Chrome, Firefox, Safari, Edge). Data is stored per
browser/device via `localStorage` — there is no sync between devices in this
version.
