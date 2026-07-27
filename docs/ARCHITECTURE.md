# AI Video Generator — Architecture

## Status

This is the initial foundation of the AI Video Generator iOS app: a working,
navigable SwiftUI app with a real (offline-mock-backed) generation pipeline,
not the full commercial product described in the original spec. See
"What's implemented" and "What's not yet built" below before treating any
module as production-ready.

## Tech stack

- **SwiftUI + MVVM.** Every feature folder under `Sources/AIVideoGenerator/Features`
  has a `View` (rendering only) and an `@Observable` `ViewModel` (state + use
  cases). Views never talk to services directly — they go through a view model.
- **Swift Concurrency.** All service protocols are `async`/`await`; long-running
  work (scene rendering, polling) runs in `Task`s owned by `GenerationQueueManager`.
- **Dependency injection.** `DependencyContainer` (`App/DependencyContainer.swift`)
  is the single composition root. It is handed down via
  `@Environment(DependencyContainer.self)`; nothing reaches for a singleton.
- **Provider abstraction.** `AIVideoProviding` / `AIThumbnailProviding`
  (`Services/Providers/AIVideoProviding.swift`) decouple the app from any one
  AI vendor. `ProviderRegistry` looks providers up by ID. Today only
  `MockAIVideoProvider` / `MockAIThumbnailProvider` are registered — swapping
  in a real vendor is a matter of adding a new conforming type and registering
  it in `DependencyContainer.live()`.
- **XcodeGen.** The `.xcodeproj` is generated from `project.yml`, not committed,
  so project-file merge conflicts don't happen. Run `xcodegen generate` after
  cloning (see `AIVideoGenerator/README.md`).

## Long-duration video generation (up to 90 minutes)

`GenerationRequest.requestedDuration` allows up to 90 minutes. Because no
provider can render that in a single call, `SceneDecomposer`
(`Core/Models/GenerationRequest.swift`) splits any request whose duration
exceeds the active provider's `maxSingleSceneDuration` into a `SceneScript` of
provider-sized `GenerationScene`s, each carrying a continuity-preserving prompt
continuation. `GenerationQueueManager` renders scenes with bounded parallelism,
reports fractional progress after each batch, and stitches completed scenes via
the `VideoStitching` protocol (`PassthroughVideoStitcher` today; a real
AVFoundation/server-side composition pipeline is the next step there).

## What's implemented

- Full design system (theme, typography, spacing, glass cards, chips, buttons,
  progress rings) adapting to Light/Dark Mode.
- Home dashboard: hero actions, generation queue, trending styles, templates,
  quick actions, recent projects, favorites, storage usage.
- AI Video Generator flow: prompt + AI prompt-assist actions, style/resolution/
  frame-rate/aspect-ratio/duration/camera-movement/lighting pickers, submission
  to a real (mock-backed) async job queue with live progress.
- AI Thumbnail Generator flow with category selection.
- Projects library: search, folder filter, favorites, swipe-to-delete.
- Auth: Sign in with Apple (real `ASAuthorizationController` UI), Google and
  email/password flows (mocked pending real OAuth/backend wiring), Keychain-backed
  session storage.
- Settings: theme, generation defaults, AI provider selection, notifications,
  account/sign-out, Privacy Policy / Terms of Service / Report Content screens.
- Local persistence (`LocalProjectStore`, JSON on disk) — cloud sync is modeled
  in `SubscriptionPlan.cloudSyncEnabled` but not yet implemented.
- Unit tests for request validation, scene decomposition, the queue manager, and
  the Video Generator view model.
- GitHub Actions CI (`.github/workflows/ios-ci.yml`) that regenerates the Xcode
  project and runs a real `xcodebuild build`/`test` on every push — this is the
  actual compiler verification this environment could not run directly.

## What's not yet built

- Any real backend (REST API, database, job queue, moderation, rate limiting).
  `APIClient`/`Endpoint` define the contract; there is no server behind it yet.
- Real AI provider integrations (only the offline mock exists).
- Video editor (trim/split/merge/crop/color grade/VFX/transitions), sound
  (music/narration/voice cloning/ambient), subtitles, and export pipeline.
- Google Sign-In SDK and real backend-issued auth tokens (currently mocked).
- Cloud sync and version history persistence.
- App icon / launch screen assets, full accessibility pass, and iPad-specific
  layout polish beyond the basic `NavigationSplitView` shell.

## Folder layout

```
AIVideoGenerator/
  project.yml                  XcodeGen spec (source of truth for the Xcode project)
  Sources/AIVideoGenerator/
    App/                        Composition root, environment wiring, app entry point
    Core/                       Domain models, errors, extensions, utilities
    DesignSystem/                Theme, typography, spacing, reusable components
    Networking/                  APIClient, Endpoint, NetworkError
    Services/
      Providers/                 AI provider protocols + mocks + registry
      Auth/                       Auth protocol, mock implementation, Keychain
      Persistence/                Project storage protocol + local implementation
      JobQueue/                   Generation queue manager + scene stitching
    Features/
      Home/, VideoGenerator/, Thumbnail/, Projects/, Auth/, Settings/
  Tests/AIVideoGeneratorTests/
  Resources/                     Bundled Privacy Policy / Terms of Service
```
