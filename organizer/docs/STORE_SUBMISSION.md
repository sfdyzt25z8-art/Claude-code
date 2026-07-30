# Organizer — App Store / Play Store submission checklist

This is the honest gap list for taking `apps/mobile` from "runs in Expo Go /
a dev build" to "live on the stores." None of this is done yet — it can't
be, without an Apple Developer account, a Google Play Console account, and
real production credentials, all of which belong to whoever owns this
project, not to this repo.

## 1. One-time account setup

- [ ] Apple Developer Program membership ($99/yr) — needed for `appleId`,
      `ascAppId`, `appleTeamId` in `apps/mobile/eas.json`.
- [ ] Google Play Console account ($25 one-time) — needed for the service
      account JSON referenced by `eas.json`'s `android.serviceAccountKeyPath`.
- [ ] `npx eas login` then `npx eas init` from `apps/mobile/` to get a real
      `extra.eas.projectId` (replace the placeholder in `app.config.ts`).

## 2. Assets

- [x] App icon source: `assets/icon/organizer-icon.svg`, rendered PNGs
      already copied into `apps/mobile/assets/` (`icon.png`,
      `adaptive-icon.png`, `splash-icon.png`/`splash.png`).
- [ ] iOS screenshots (6.7", 6.5", 5.5" or current required sizes) and
      Android screenshots (phone + at least one tablet) — capture from a
      real build once one exists; can't be produced from static analysis.
- [ ] Optional: a short app preview video for the App Store.

## 3. Store listing content (draft — refine before submitting)

**Short description (Play Store, ≤80 chars):**
"Your AI-powered life OS — study, business, and personal goals in one app."

**Full description (draft):**
Organizer is an AI-powered life operating system. Pick a mode — Student,
Business, or Personal — and get a dashboard, tools, and an AI assistant
built for that part of your life: homework and quizzes, revenue and
academies, or habits and goals. Track progress, build streaks, and let the
AI assistant help you plan the next step.

**Category:** Productivity
**Privacy policy URL:** required by both stores before submission — write
one covering the real data collected (email, profile fields, usage data
sent to OpenAI for the AI assistant) and host it somewhere public.
**Support URL / contact email:** required by both stores.

## 4. Technical readiness

- [ ] Real Firebase project (not the dev bypass) with Google/Apple sign-in
      configured for the production bundle ID/package name.
- [ ] `apps/mobile/eas.json` build `env` blocks point at your real deployed
      backend URL, not `localhost`.
- [ ] iOS: Sign in with Apple capability enabled on the App ID in the Apple
      Developer portal (matches `usesAppleSignIn: true` in `app.config.ts`).
- [ ] Android: generate/upload a production keystore (EAS can manage this:
      `eas credentials`).
- [ ] Run `eas build --platform ios --profile production` and
      `eas build --platform android --profile production`, then
      `eas submit` for each — see the [EAS docs](https://docs.expo.dev/submit/introduction/).
- [ ] Apple App Review and Google Play review both require a fully working
      backend reachable from the build — a `localhost` API will get the
      build rejected.

## 5. Post-launch

- [ ] Set up crash reporting (Sentry or similar) — not included in this
      codebase.
- [ ] Set up the production database backup/monitoring for the Postgres
      instance the backend depends on.
