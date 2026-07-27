# Organizer — Local setup

## Prerequisites

- Node.js 18.18+
- PostgreSQL (local or hosted, e.g. Supabase/Neon/RDS)
- A Firebase project (Authentication enabled: Email/Password, Google, Apple)
- An OpenAI API key (optional in dev — the AI assistant and quiz generator
  fall back to local logic without one)
- Expo CLI (`npx expo`) for the mobile app; no global install required

## 1. Install dependencies

From the repo root (`organizer/`):

```bash
npm install
```

This installs all three apps and the shared package via npm workspaces.

## 2. Configure environment variables

Copy each app's `.env.example` to `.env` (backend, web) / set Expo public env
vars (mobile) and fill in:

- `apps/backend/.env` — `DATABASE_URL`, Firebase Admin service account
  (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`),
  `OPENAI_API_KEY` (optional), `CORS_ORIGIN`.
- `apps/web/.env.local` — `NEXT_PUBLIC_API_URL`, Firebase web config
  (`NEXT_PUBLIC_FIREBASE_*`).
- `apps/mobile` — `EXPO_PUBLIC_API_URL` (use your machine's LAN IP for
  physical devices, not `localhost`), Firebase web config.

## 3. Set up the database

```bash
cd apps/backend
npx prisma migrate dev
npx prisma db seed
```

## 4. Run everything

```bash
# from repo root, each in its own terminal
npm run dev:backend   # http://localhost:4000
npm run dev:web       # http://localhost:3000
npm run dev:mobile    # Expo dev server / QR code
```

## Notes

- The backend refuses to silently "pretend" auth works: without Firebase
  Admin credentials it logs a startup warning, and only accepts requests via
  the explicit dev bypass described in `docs/ARCHITECTURE.md`.
- App icon source lives at `assets/icon/organizer-icon.svg`; rendered PNGs
  are already copied into `apps/web/public` and `apps/mobile/assets`.
