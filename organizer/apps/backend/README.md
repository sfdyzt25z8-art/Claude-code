# Organizer Backend

Express + Prisma (PostgreSQL) API powering the Organizer app (student / business /
personal life-OS). Authentication identity lives in Firebase; this service verifies
Firebase ID tokens, auto-provisions a local `User` row, and serves all app data plus
AI-assisted features (chat, adaptive quizzes) backed by OpenAI with graceful local
fallbacks.

## Setup

1. Install dependencies from the monorepo root (this backend is an npm workspace):
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values you have available:
   ```bash
   cp .env.example .env
   ```
   At minimum you need a working `DATABASE_URL` (PostgreSQL). Firebase and OpenAI
   credentials are optional in development - see "Running without real credentials"
   below.
3. Generate the Prisma client and run migrations against your database:
   ```bash
   npm run prisma:generate --workspace=apps/backend
   npm run prisma:migrate --workspace=apps/backend
   ```
4. Seed reference content (badges, academy modules, sample courses/books):
   ```bash
   npm run seed --workspace=apps/backend
   ```
5. Start the dev server (hot reload via `tsx watch`):
   ```bash
   npm run dev --workspace=apps/backend
   ```
   The API listens on `PORT` (default `4000`); `GET /health` is a liveness check.

## Running without real credentials (dev-only)

- **Firebase**: if `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`
  are unset, the server still boots (it logs a warning) but real `Authorization: Bearer
  <token>` requests will fail verification. For local development/testing, set
  `ALLOW_DEV_AUTH_BYPASS=true` and send requests with an `x-dev-user-email: someone@example.com`
  header instead of a real Firebase ID token - the middleware will upsert a `User` with a
  synthetic `firebaseUid` (`dev:<email>`) and treat it as authenticated.
  **Never enable `ALLOW_DEV_AUTH_BYPASS` in production** - it bypasses all real auth.
- **OpenAI**: if `OPENAI_API_KEY` is unset, AI chat replies and quiz-question generation
  fall back to local static content (a canned coaching reply, and a hand-written
  8-subject/10-question-each quiz bank) instead of failing.
- **Storage**: `STORAGE_PROVIDER=local` (the default) writes uploads to `apps/backend/uploads/`
  and serves them from `/uploads`. Set `STORAGE_PROVIDER=s3` plus the `AWS_*` env vars to
  upload to S3 instead.

## Architecture

```
src/
  index.ts            Express app wiring: middleware, route mounting, error handler
  lib/
    prisma.ts          Singleton PrismaClient (hot-reload safe)
    firebaseAdmin.ts   Lazy firebase-admin init + verifyIdToken() + Messaging accessor
    openai.ts          OpenAI wrapper: chatCompletion(), generateQuizQuestions() with fallback
    storage.ts         StorageProvider interface + Local/S3 implementations
    httpError.ts        HttpError class used by the central error handler
  middleware/
    auth.ts            requireAuth (Firebase/dev-bypass) + requireAdmin
    validate.ts        zod validateBody()/validateQuery() middleware factories
    errorHandler.ts    asyncHandler wrapper, 404 handler, central error handler
  services/
    gamification.ts    awardXp, updateStreak, badge-award rules
    badges.ts          Canonical badge definitions
    quizBank.ts         Static question bank (8 subjects x 10 Qs) + adaptive quiz assembly
    aiChat.ts           Shared conversation/memory/system-prompt logic for AI chat routes
    fcm.ts              Push notification sending (no-ops gracefully if unconfigured)
  routes/               One Express router per API area (see below)
  utils/                Enum <-> shared-type casing helpers, response serializers
prisma/
  schema.prisma        Data model (already finalized upstream - read-only for this service)
  seed.ts               Seeds badges, academy modules (real written content), courses, books
```

## Route summary (mounted per `API_ROUTES` from `@organizer/shared`)

| Prefix              | Router               | Notes                                                        |
|---------------------|----------------------|----------------------------------------------------------------|
| `/api/auth`         | `routes/auth.ts`      | `GET /me`                                                    |
| `/api/onboarding`    | `routes/onboarding.ts`| `POST /`                                                      |
| `/api/profile`      | `routes/profile.ts`   | `GET /`, `PATCH /`                                            |
| `/api/ai`           | `routes/ai.ts`        | chat, conversations, suggestions                             |
| `/api/student`      | `routes/student.ts`   | homework, grades, study plan, exams, reading, study sessions, quizzes, mini-games |
| `/api/business`     | `routes/business.ts`  | revenue/expenses/overview, budgets, goals, investments, marketing, academies, career goals, AI coach |
| `/api/personal`     | `routes/personal.ts`  | goals, habits (+log), check-ins, focus options               |
| `/api/calendar`     | `routes/calendar.ts`  | events (`?from=&to=`), reminder rules                         |
| `/api/notifications`| `routes/notifications.ts` | push token registration, list, mark-read                 |
| `/api/statistics`   | `routes/statistics.ts`| aggregate dashboard stats (+ business analytics if applicable) |
| `/api/admin`        | `routes/admin.ts`     | user mgmt, courses, books, broadcast, analytics, AI usage (all `requireAdmin`) |
| `/api/uploads`      | `routes/uploads.ts`   | multipart file upload (10MB limit) via `StorageProvider`      |

All routes except `/health` and (obviously) the dev-bypass path require a valid
Firebase ID token (or the dev bypass header) via `requireAuth`.

## Notes / follow-ups

- The `@organizer/shared` package currently ships raw TypeScript (`main`/`types` point at
  `src/index.ts`). `npm run dev` (via `tsx`) resolves this fine, but the compiled
  `npm run build && npm start` path (`node dist/index.js`) requires Node to be able to
  resolve `@organizer/shared` at runtime - either run the backend with `tsx`/`ts-node` in
  production too, or have the shared package build to JS before the backend's `node
  dist/index.js` step runs. This is a monorepo-wide wiring concern shared with the other
  workstreams, not something fixed inside `apps/backend` alone.
- Prisma enums are `UPPER_SNAKE_CASE`; the shared TS types the web/mobile apps consume use
  `lower_snake_case` string literals. `src/utils/serialize.ts` provides `enumToShared` /
  `sharedToEnum` case-conversion helpers used throughout the routes to keep API responses
  aligned with `@organizer/shared` types.
