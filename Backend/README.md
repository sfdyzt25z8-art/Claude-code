# AI Video Generator — Backend

A real Vapor (Swift on the server) backend implementing the REST contract the
iOS client already defines in `AIVideoGenerator/Sources/AIVideoGenerator/Networking/Endpoint.swift`.

## Status

This has been written carefully but **never built or run** — this development
environment has no Swift toolchain and no network access to resolve Swift
Package Manager dependencies, so `swift build`/`swift test` could not be
executed here. Vapor's own API (especially around JWT signing and async
testing helpers) has shifted across versions; **before relying on this,
run `swift build` yourself and fix any API mismatches against whatever
package versions actually resolve.** Everything else about the design —
routes, models, moderation, rate limiting, auth flow — is real and complete
as written; the risk is purely "does this exact API call exist with this
exact signature in the resolved package version," not "is this a stub."

## Requirements

- Swift 5.10+
- macOS or Linux with the Swift toolchain installed

## Running locally

```sh
cd Backend
swift run
```

This starts the server on `http://localhost:8080` with a local SQLite
database file (`db.sqlite`) and migrations applied automatically. Set
`JWT_SECRET` before running anywhere but your own machine:

```sh
JWT_SECRET=$(openssl rand -base64 32) swift run
```

## Running tests

```sh
cd Backend
swift test
```

## Endpoints

| Method | Path                        | Auth | Description                                  |
|--------|-----------------------------|------|-----------------------------------------------|
| POST   | `/v1/auth/signup`           | No   | Create an account, returns a JWT              |
| POST   | `/v1/auth/signin`           | No   | Sign in, returns a JWT                        |
| POST   | `/v1/auth/reset-password`   | No   | Placeholder — doesn't send an email yet       |
| GET    | `/v1/me`                    | Yes  | Current user + subscription limits            |
| GET    | `/v1/providers`             | No   | Available AI video providers                  |
| POST   | `/v1/jobs/video`            | Yes  | Create a video generation job                 |
| POST   | `/v1/jobs/thumbnail`        | Yes  | Create a thumbnail generation job             |
| GET    | `/v1/jobs/:jobID`           | Yes  | Poll a job's status                           |
| POST   | `/v1/jobs/:jobID/cancel`    | Yes  | Cancel a job                                  |
| POST   | `/v1/prompt-assist`         | Yes  | Improve/expand/shorten/suggest for a prompt   |
| GET    | `/health`                   | No   | Liveness check                                |

## What's real vs. what's a placeholder

**Real:**
- JWT-based auth with bcrypt-hashed passwords (`Controllers/AuthController.swift`)
- A working token-bucket rate limiter (`Middleware/RateLimitMiddleware.swift`)
- A keyword-based content moderation filter (`Services/ModerationService.swift`)
- Fluent/SQLite persistence with real migrations
- Subscription credit enforcement (`user.usedGenerationCredits` vs. `monthlyGenerationCredits`)
- A provider abstraction (`Services/VideoProviderService.swift`) matching the
  client's, so a real vendor integration is a new conforming type, not a
  rewrite

**Explicitly not implemented — these need something only the app's owner can provide:**
- Sign in with Apple / Google token verification (needs the app registered
  with both identity providers)
- Any real AI video/thumbnail provider (needs a contract and API key with an
  actual provider)
- Transactional email for password reset (needs a mail provider account)
- Rich generation parameters on `CreateVideoJobRequest` (style, resolution,
  camera/lighting, duration) — only `prompt`/`providerID` are threaded through
  today; extending this to match the client's full `GenerationRequest` is
  straightforward but not yet done
- Deployment/hosting of any kind — this runs locally only
