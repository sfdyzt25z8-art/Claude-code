# Organizer — Architecture

Organizer is an AI-powered life operating system with three personalized modes
(Student, Business, Personal), built as a monorepo so the web app, mobile app,
and backend share one contract.

## Monorepo layout

```
organizer/
  package.json              npm workspaces root
  tsconfig.base.json         shared compiler options + @organizer/shared path alias
  packages/
    shared/                  types, theme tokens, constants, i18n — the contract
                             every app builds against
  apps/
    backend/                 Node.js + Express + TypeScript + Prisma + PostgreSQL
    web/                      Next.js 14 (App Router) + TypeScript + Tailwind
    mobile/                   Expo (React Native) + TypeScript
  assets/icon/                source SVG + rendered PNG app icon
  docs/                       this file, setup notes
```

## Why a shared package

`packages/shared` is the single source of truth for:

- **Domain types** (`User`, `UserProfile`, `Homework`, `Quiz`, `BusinessGoal`,
  `Habit`, `CalendarEvent`, `ChatMessage`, ...) — the backend's Prisma models,
  the web app's API responses, and the mobile app's local state all reference
  the same shapes, so a field rename happens in one place.
- **The dynamic theme system** (`getThemeTokens(mode)`) — Student/Business/
  Personal color palettes and copy live here once; web writes them as CSS
  variables, mobile reads them into a React context. Neither app hardcodes
  mode colors.
- **Constants and i18n** — subjects, mini-games, academies, XP/coin reward
  tables, supported languages, and translation dictionaries.

Both Next.js and Expo/Metro are configured to transpile this package's
TypeScript source directly (`transpilePackages` / `watchFolders`) rather than
requiring a separate build step during development.

## Data model (Prisma / PostgreSQL)

See `apps/backend/prisma/schema.prisma` for the full model. It covers:
identity (`User`, `Profile`), gamification (`Gamification`, `Badge`,
`UserBadge`, `XpEvent`), Student mode (`Homework`, `GradeEntry`,
`StudyPlanItem`, `Exam`, `ReadingEntry`, `StudySession`, `Quiz` +
`QuizQuestion` + `QuizAttempt`, `MiniGameScore`), Business mode
(`RevenueEntry`, `ExpenseEntry`, `Budget`, `BusinessGoal`, `InvestmentEntry`,
`MarketingPlanItem`, `AcademyModule` + `AcademyProgress`, `CareerGoal`),
Personal mode (`PersonalGoal`, `Habit` + `HabitLog`, `ProgressCheckIn`),
cross-cutting concerns (`CalendarEvent`, `ReminderRule`, `PushToken`,
`NotificationRecord`), the AI assistant (`AiConversation`, `ChatMessage`,
`AiMemoryItem`, `AiSuggestion`, `AiUsageRecord`), and admin/content
(`Course`, `Book`, `AdminAnalyticsSnapshot`, `UploadedFile`).

## Auth model

Firebase Authentication is the identity provider for all three apps (email
verification, password reset, Google, Apple). Clients send the Firebase ID
token as a bearer token; the backend verifies it with `firebase-admin` and
lazily provisions a local `User` row keyed by `firebaseUid`. The backend never
handles passwords directly. A gated dev-only bypass
(`ALLOW_DEV_AUTH_BYPASS=true` + `x-dev-user-email` header) exists purely for
local development without real Firebase credentials — it must stay off in
any deployed environment.

## AI assistant

`apps/backend` wraps the OpenAI API behind a service that (a) personalizes the
system prompt using the user's mode/profile and stored `AiMemoryItem`s, and
(b) degrades gracefully — quiz generation and chat both fall back to local
logic if `OPENAI_API_KEY` is absent or the call fails, so the app never hard
-fails on a missing key.

## What's real vs. scaffolded

This codebase is a genuine, working foundation, not a mockup: real Prisma
queries, real auth verification, real forms wired to real endpoints. It is
not a finished, store-submitted product — see each app's own README for the
honest breakdown of what's fully implemented versus intentionally deferred
(e.g. most mini-games beyond the first couple, full EAS/App Store submission
config, production Firebase/OpenAI credentials).
