# Organizer — Mobile (Expo / React Native)

The mobile client for Organizer, an AI-powered life-organization app (student /
business / personal "life OS"). Built with Expo (managed workflow), React
Navigation, and TypeScript, sharing types/theme/i18n with the web app and
backend via `@organizer/shared`.

## Prerequisites

- Node >= 18.18 (see root `package.json` `engines`)
- The Organizer backend running (see `apps/backend`) — this app is a thin
  client with no local data; every screen reads/writes through the API.
- A Firebase project shared with `apps/web` (same project = same users).
- Expo Go app on your phone (easiest), or iOS Simulator / Android Emulator.

## Setup

From the monorepo root, dependencies are installed via npm workspaces:

```bash
npm install
```

(You may also use `npx expo install` from inside `apps/mobile` to add/update
Expo-managed native dependencies later — this was intentionally **not** run
as part of authoring this app, so run it before first launch.)

Copy the env file and fill in real values:

```bash
cd apps/mobile
cp .env.example .env
```

Required variables (see `.env.example` for details):

- `EXPO_PUBLIC_API_URL` — backend base URL.
  - iOS simulator / Expo web: `http://localhost:4000` works.
  - **Physical device or Android emulator**: `localhost` refers to the
    device itself, not your dev machine. Set this to your computer's LAN IP,
    e.g. `http://192.168.1.23:4000`. Find it with `ipconfig getifaddr en0`
    (macOS Wi-Fi) or `hostname -I` (Linux). Android emulator specifically
    can also reach the host machine via `http://10.0.2.2:4000`.
- `EXPO_PUBLIC_FIREBASE_*` — same Firebase web app config used by `apps/web`.
- `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` — OAuth client IDs for Google sign-in via
  `expo-auth-session` (Expo/iOS/Android/Web client IDs from Google Cloud
  Console + Firebase Authentication → Sign-in method → Google).

## Running

```bash
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code
with Expo Go on a physical device.

## What's implemented (real, working, wired to the API contract)

- **Auth**: email/password sign up, sign in, forgot password, Google
  sign-in (`expo-auth-session`), Apple sign-in (iOS only, gated by
  `Platform.OS === "ios"`) — all via the `firebase` JS SDK with
  AsyncStorage-backed persistence (`src/lib/firebaseClient.ts`,
  `src/lib/auth-context.tsx`).
- **Onboarding**: multi-step form (name/age → country/language → mode →
  conditional ownsBusiness/personalFocus) posting to `POST /api/onboarding`.
- **Theming**: `src/theme/ThemeContext.tsx` mirrors the web app's theme
  system — `getThemeTokens(mode)` from `@organizer/shared` drives every
  screen's colors/gradient/motivational copy through a `useTheme()` hook.
- **Student mode**: dashboard, Homework (list/add/complete/delete), Exams
  (list/add + 1-day-before local reminder via `expo-notifications`),
  Gradebook (list/add + live weighted average), and a full Quiz flow
  (subject picker → `POST /api/student/quizzes` → 1-question-at-a-time play
  → `POST /api/student/quizzes/:id/attempts` → score screen).
- **Business mode**: dashboard (net profit, revenue vs. expenses), Finances
  (revenue + expense quick entry with running totals), Budgets
  (create/delete by category+period), Goals (create + "log +10% progress"
  with a progress bar, backed by `PATCH /api/business/goals/:id`).
- **Personal mode**: dashboard, Goals (create/complete with optional
  target/current tracking), Habits (create + **one-tap daily check-in**
  against `POST /api/personal/habits/:id/logs`), Progress check-ins
  (log a focus area + numeric value + note over time).
- **AI Assistant**: real chat UI against `POST /api/ai/chat`, loading the
  most recent conversation's history from `GET /api/ai/conversations` +
  `GET /api/ai/conversations/:id/messages` on open.
- **Calendar**: agenda list of `GET /api/calendar/events` grouped by day,
  color-coded badges per category.
- **Settings**: profile edit (name/country) via `PATCH /api/profile`, mode
  switcher, language picker, "Enable notifications" (registers an Expo push
  token with `POST /api/notifications/push-token`), sign out, and a
  Tutorial Center that replays `TutorialOverlay` (step dots + skip) and
  persists `tutorialCompleted` back to the profile.
- **Notifications**: `src/lib/notifications.ts` requests permission,
  registers the Expo push token with the backend, and provides a real
  local-notification scheduler (`scheduleReminderNotification`) — wired up
  today from the Exams screen ("Remind me 1 day before").

### Intentionally omitted this pass (per scope — mobile is a smaller, 100%
real slice, not full web parity)

- Mini-games (`MINI_GAMES` / `/api/student/*/mini-game-scores`), reading
  tracker, and study-session timers.
- Business Investments, Marketing plans, Academies/modules, and
  Career-goals (non-owner track) screens.
- Admin screens (not applicable to mobile).
- Server-push round trip for reminders (the token registration + local
  scheduling both work; actually triggering a *server-sent* push requires
  the backend's notification-dispatch job, which is out of scope here).

## Assets

- `assets/icon.png`, `assets/adaptive-icon.png`, and `assets/splash.png` are
  populated from the shared app-icon design at
  `../../assets/icon/icon-1024.png` (same source the web app favicon uses).
  The splash image is currently just the square icon centered on the brand
  background color (`app.config.ts` → `splash.backgroundColor`) — swap in a
  proper wide-format splash graphic before shipping.
- For a production submission, regenerate properly-sized/rounded icon
  variants (App Store / Play Store require specific padding/safe-zones) —
  `npx expo-optimize` and the Expo icon guidelines are good starting points.

## Architecture notes

- **Monorepo/shared package**: `metro.config.js` adds
  `packages/shared` and the repo root to `watchFolders`, plus both
  `node_modules` directories to `resolver.nodeModulesPaths`, so Metro can
  watch/transpile `@organizer/shared`'s raw TypeScript (no separate build
  step needed — Expo's Babel/Metro pipeline transpiles TS outside
  `node_modules` as long as it's watched).
- **API client** (`src/lib/api.ts`): typed `apiGet/apiPost/apiPatch/apiPut/apiDelete`
  wrapping `fetch`, attaching `Authorization: Bearer <Firebase ID token>` from
  the current Firebase user, and throwing a typed `ApiError` (status + body)
  on non-2xx responses or network failures.
- **Navigation** (`src/navigation/`): `RootNavigator` switches between
  `AuthNavigator` (signed out), `OnboardingScreen` (signed in, profile not
  onboarded), and `MainTabNavigator` (Dashboard / Calendar / AI Assistant /
  Settings tabs). The Dashboard tab hosts one native-stack navigator
  (`DashboardStackNavigator`) whose *initial route* is chosen by
  `profile.mode` (Student/Business/Personal dashboard); all three modes'
  screens are registered on the same stack so switching modes in Settings
  doesn't require remounting the navigator.
- **UI primitives** (`src/components/ui/`): `GlassCard` (real blur via
  `expo-blur`'s `BlurView`), `Button`, `Input`, `ProgressBar`, `Badge` — all
  theme-aware via `useTheme()`.

## EAS build (high-level, not run in this pass)

1. `npm install -g eas-cli` then `eas login`.
2. `eas build:configure` to generate a real `extra.eas.projectId` (currently
   a placeholder in `app.config.ts`) and `eas.json`.
3. `eas build --platform ios|android --profile production`.
4. `eas submit` to push to App Store Connect / Google Play Console.

Push notifications additionally require an Expo push notification
credentials setup (`eas credentials`) and, for iOS, an APNs key uploaded to
Expo's push service — see https://docs.expo.dev/push-notifications/overview/.
