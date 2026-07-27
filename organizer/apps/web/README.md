# Organizer — Web App

The Next.js 14 (App Router) web client for Organizer, the AI-powered life operating system. This app is part of the `organizer` monorepo and shares types, theme tokens, i18n strings, and constants with the backend and mobile apps via `@organizer/shared` (`packages/shared`).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (theme driven by CSS custom properties set from `@organizer/shared` theme tokens)
- Framer Motion for animation
- Recharts for charts
- Firebase Auth (email/password, Google, Apple)
- react-hook-form + zod for forms/validation
- lucide-react icons, date-fns for date handling

## Getting started

From the monorepo root:

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
# fill in NEXT_PUBLIC_API_URL and your Firebase web app config
npm run dev:web
```

Or from this directory:

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000) by default and expects the backend API at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

## Environment variables

See `.env.example`:

- `NEXT_PUBLIC_API_URL` — base URL of the Organizer backend API.
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` — Firebase web app config used for Authentication only (email/password, Google, Apple sign-in).

## Project structure

- `src/lib/api.ts` — typed fetch wrapper (`apiGet/apiPost/apiPatch/apiDelete/apiUpload`) that attaches the Firebase ID token as a Bearer header and throws `ApiError` on non-2xx responses.
- `src/lib/firebaseClient.ts` — Firebase app/auth initialization and auth helper functions.
- `src/lib/auth-context.tsx` — React context exposing the current Firebase user, backend `User`/`UserProfile`, and auth actions.
- `src/lib/theme-context.tsx` — applies `getThemeTokens(mode)` from `@organizer/shared` onto CSS variables on `<html>`, so the whole app re-themes instantly when mode changes (student/business/personal).
- `src/app/(auth)/*` — login, signup, forgot-password, verify-email.
- `src/app/onboarding` — multi-step onboarding wizard that posts to `/api/onboarding`.
- `src/app/(app)/*` — the authenticated app shell (sidebar + top nav) and all feature pages (dashboard, student/business/personal feature sets, AI assistant, calendar, statistics, settings).
- `src/app/admin/*` — admin console, gated on `user.role === "admin"`.
- `src/components/ui/*` — glassmorphic UI kit (GlassCard, Button, Input, Select, Modal, ProgressBar, Badge, EmptyState, LoadingSpinner).
- `src/components/games/*` — real playable mini-games (Memory Challenge, Sudoku).
- `src/components/tutorial/TutorialOverlay.tsx` — first-launch interactive tutorial, gated by `profile.tutorialCompleted` + a `localStorage` fallback flag.

## Notes on the backend contract

This app is coded against the API contract shared with the backend workstream (see the monorepo root docs). A few endpoints (e.g. `/api/statistics/gamification`, `/api/business/investments/summary`, `/api/business/academies/:key/progress`) are used defensively: if the backend doesn't (yet) implement them, the corresponding widgets fail soft (empty state) rather than crashing the page.

## Scripts

- `npm run dev` — start the dev server.
- `npm run build` / `npm run start` — production build/start.
- `npm run lint` — Next.js ESLint.
- `npm run typecheck` — `tsc --noEmit`.
