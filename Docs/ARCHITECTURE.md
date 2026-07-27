# AI Video Generator — Architecture

## Overview

AI Video Generator is a SwiftUI iOS/iPadOS app built with MVVM, Swift
Concurrency, and a provider-agnostic backend abstraction so multiple AI
video/thumbnail/prompt-assist vendors can be swapped in without touching
feature code.

## Project Layout

```
AIVideoGenerator/
  App/                  Composition root, root navigation, app-wide state
  Core/
    DesignSystem/       Theme tokens, typography, glassmorphism backgrounds
    Components/         Reusable SwiftUI views (buttons, cards, chips, …)
    Networking/         APIClient / APIEndpoint / APIError
    Utilities/          Keychain, Logger, Debouncer
    Extensions/         Small View/Color/Foundation extensions
  Domain/
    Models/             Value types shared across features (Codable, Sendable)
    Providers/          AIProvider capability protocols + MockAIProvider
    Services/           Auth, project persistence, job queue, storage usage
  Features/
    Home/               Dashboard: quick actions, recents, templates, queue
    VideoGenerator/      Prompt → style/options/camera/lighting → generate
    ThumbnailGenerator/  Prompt → style → 4 candidate thumbnails
    Editor/              Timeline, trim/split/merge, effects, sound, export
    Projects/            Library: search, folders, tags, favorites, versions
    Auth/                Sign in with Apple/Google/email, sign up, reset
    Onboarding/          First-run carousel
    Settings/            Theme, defaults, AI provider selection, legal
  Resources/             Info.plist, entitlements, asset catalog
AIVideoGeneratorTests/    XCTest unit tests for services and view models
Docs/                     This file, plus compliance references
project.yml               XcodeGen project spec (see below)
```

## Opening the project

This repository ships **source only** — no checked-in `.xcodeproj`, since
generated Xcode project files churn badly in diffs. Generate one locally:

```
brew install xcodegen
xcodegen generate
open AIVideoGenerator.xcodeproj
```

Requires Xcode 15+ (Swift 5.10, iOS 17 SDK).

## Dependency injection

`AppEnvironment` (`App/AppEnvironment.swift`) is the composition root: it
constructs every service once and the concrete instances are threaded
through explicit initializers (`HomeView(viewModel:projectStore:)`, etc.)
rather than resolved from a global singleton/locator. Shared, frequently
observed services (`ProviderRegistry`, `JobQueueService`,
`PromptAssistantService`, `AppState`) are also injected as
`@EnvironmentObject`s at the app root so any nested view can subscribe to
their changes without threading them through every intermediate view.

`@AppStorage` is intentionally **not** used inside `AppState` — it's
designed for direct use inside a `View` and does not forward
`objectWillChange` when embedded in a plain `ObservableObject` class.
`AppState` instead uses `@Published` properties with manual `UserDefaults`
persistence in `didSet`, so every view observing it via `@EnvironmentObject`
reliably re-renders.

## The AI provider abstraction

Three narrow protocols in `Domain/Providers/AIProvider.swift` describe what
a backend can do:

- `VideoGenerationProviding` — streams `GenerationEvent`s (queued → per-scene
  progress → stitching → completed/failed) via `AsyncThrowingStream`.
- `ThumbnailGenerationProviding` — returns thumbnail candidates with
  AI-suggested text placement and contrast.
- `PromptAssistProviding` — improve/expand/shorten/translate a prompt, and
  suggest styles/lighting/camera moves/moods/environments/shots.

`ProviderRegistry` holds the configured providers for each capability and
the user's active selection (persisted, editable from Settings → AI
Provider Selection). `MockAIProvider` is a fully functional, self-contained
implementation used for local development, previews, and demo builds before
a production backend is wired in — it simulates realistic timing and
implements the long-form scene-stitching pipeline end-to-end so the entire
UI can be built and tested against real async event streams.

To add a real backend: implement the relevant protocol(s), register the
instance in `AppEnvironment.init`, and it appears automatically in Settings.

### Long-form video (up to 90 minutes)

`SceneStitchingPlanner` (`Domain/Models/VideoGenerationRequest.swift`) is a
pure function that slices any request longer than a provider's
`maxSceneSeconds` into multiple continuity-aware scenes. `JobQueueService`
drives generation of each scene through the active provider and reports a
single `GenerationJob` back to the UI whose status transitions through
`.generating` → `.stitching` → `.completed`, with a live per-scene progress
breakdown and an estimated completion time.

## Authentication

`AuthServiceProtocol` is implemented twice:

- `AuthService` — production-shaped implementation. Apple Sign In uses
  `AuthenticationServices` directly; Google Sign In uses an OAuth
  authorization-code flow over `ASWebAuthenticationSession` (no third-party
  SDK dependency); email/password calls a configurable backend. Tokens are
  stored in the Keychain via `AuthTokenStore`, never in `UserDefaults`.
- `MockAuthService` — fully functional in-memory implementation used by the
  demo build (`AppEnvironment.isRunningInDemoMode`) so the full app is
  explorable before a backend exists.

## Local persistence

`LocalProjectStore` persists the project library as JSON in the app's
Documents directory behind an `actor`, so concurrent writes from the job
queue can't corrupt it. Cloud sync (Settings → Cloud synchronization) is a
natural next milestone: diff this store against a remote collection once a
backend is connected — the `ProjectStoreProtocol` seam already isolates
feature code from the storage mechanism.

## Video editing & export

`Features/Editor` models the timeline as `[EditorClip]` (trim/speed/
rotation/crop/transition per clip) plus overlays (`TitleOverlay`,
`SubtitleCue`), sound (`SoundAsset`), and effects (`VisualEffect`).
`VideoCompositionExporter` renders the timeline via `AVMutableComposition` +
`AVAssetExportSession` — this is the real, production rendering pipeline;
it produces actual MP4/MOV/HEVC output once clips reference real, locally
available media (rather than the demo engine's placeholder URLs).

## Known scaffold limitations

This codebase was authored without access to a macOS/Xcode toolchain, so it
has not been compiled by `swiftc`/`xcodebuild` in this environment. Every
file was written and manually cross-checked for API correctness (in
particular, explicit `Hashable`/`Equatable` conformance on every enum/struct
used in `ForEach(id:)`, `Picker`/`.tag()`, `navigationDestination(item:)`,
and `Set<T>` contexts — a common SwiftUI compile pitfall). Please run
`xcodegen generate && xcodebuild -scheme AIVideoGenerator build` (or open in
Xcode) as the first verification step, and treat any remaining diagnostics
as expected follow-up rather than a sign the architecture is wrong.

Not yet implemented (left as clearly-marked extension points rather than
placeholder code): push notification wiring, StoreKit subscription
purchase flow, PHPhotoLibrary "Save to Photos" call, and a real backend for
`AuthService`/billing/content moderation. `SubscriptionPlan` /
`AccountEntitlements` model the data shape so the UI never assumes
unlimited generation — wiring them to a real entitlements endpoint does not
require UI changes.
