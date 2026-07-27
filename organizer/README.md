# Organizer

An AI-powered life operating system with three personalized modes — **Student**,
**Business**, and **Personal** — spanning a Next.js web app, an Expo/React
Native mobile app, and a shared Node/Express + Prisma/PostgreSQL backend.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the pieces fit
together and [`docs/SETUP.md`](docs/SETUP.md) for local setup.

## Quick start

```bash
npm install                 # installs all workspaces + builds packages/shared
cd apps/backend && npx prisma migrate deploy && npx prisma db seed && cd ../..
npm run dev:backend         # http://localhost:4000
npm run dev:web             # http://localhost:3000 (separate terminal)
npm run dev:mobile          # Expo dev server (separate terminal)
```

Fill in `.env` files first — see [`docs/SETUP.md`](docs/SETUP.md).

## What's implemented

This has been built and verified, not just written: all three workspaces pass
`npm run typecheck`, the backend compiles and its compiled output was booted
against a real local PostgreSQL database (migrated, seeded, and exercised
end-to-end — onboarding, adaptive quiz generation and scoring, XP/coins/streak
gamification — via live HTTP requests), and the web app passes a full
production `next build` (all 42 routes prerender).

- **Backend** (`apps/backend`): Firebase-token auth with auto-provisioning,
  onboarding/profile, full Student feature set (homework, gradebook, study
  planner, exam countdown, adaptive 15-question quizzes with an OpenAI path
  and a real local fallback question bank, reading tracker, study sessions,
  mini-game scores), full Business feature set (revenue/expense/budget
  tracking, goals, investments, marketing planner, 7 academies with real
  written lesson content, career-goals track for non-owners, an AI coach),
  Personal mode (goals, habits with streaks, progress check-ins), calendar +
  reminders, notifications (FCM-ready), statistics aggregation, an admin API
  (users, courses, books, broadcast notifications, analytics, AI usage), file
  uploads (local storage by default, S3-ready), and gamification (XP, levels,
  coins, streaks, 10 badge rules) shared across every feature.
- **Web** (`apps/web`): auth (email/password, Google, Apple, verification,
  reset), onboarding, the dynamic Student/Business/Personal theme system,
  every dashboard and feature page listed above, an AI assistant chat, two
  real playable mini-games (Memory Challenge, Sudoku — the rest are labeled
  "coming soon"), a tutorial center, and a full admin console.
- **Mobile** (`apps/mobile`): auth, onboarding, mode-aware navigation and
  dashboards, homework/gradebook/exams/quiz flow, business finances/budgets/
  goals, personal goals/habits/progress, AI assistant chat, calendar agenda,
  settings with a tutorial center, and push-notification registration + local
  reminder scheduling.

## Known gaps (by design, not oversight)

- No real Firebase project, OpenAI key, or production database is configured
  here — you supply your own (see `docs/SETUP.md`). The backend degrades
  gracefully without them (a gated dev auth bypass, and a local fallback quiz
  bank when there's no OpenAI key).
- Most mini-games beyond Memory Challenge and Sudoku, mobile's reading
  tracker/investments/marketing/academies/admin screens, and full EAS/App
  Store/Play Store submission tooling are not built — see each app's own
  README for specifics.
- This is a real, working foundation to keep building on, not a published,
  store-ready product.
