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
- **Video Editor**, working against a real video imported from Photos
  (`EditorLaunchView`) — not against AI-generated output yet, since that
  pipeline is still mocked. See "Video Editor internals" below.
- Auth: Sign in with Apple (real `ASAuthorizationController` UI), Google and
  email/password flows (mocked pending real OAuth/backend wiring), Keychain-backed
  session storage.
- Settings: theme, generation defaults, AI provider selection, notifications,
  account/sign-out, Privacy Policy / Terms of Service / Report Content screens.
- Local persistence (`LocalProjectStore`, JSON on disk) — cloud sync is modeled
  in `SubscriptionPlan.cloudSyncEnabled` but not yet implemented.
- Unit tests for request validation, scene decomposition, the queue manager, the
  Video Generator view model, and the editor's timeline/split/trim/reorder math.
- GitHub Actions CI (`.github/workflows/ios-ci.yml`) that regenerates the Xcode
  project and runs a real `xcodebuild build`/`test` on every push — this is the
  actual compiler verification this environment could not run directly.

## Video Editor internals

`EditorProject` (`Core/Models/Editor/`) is a plain, Codable, AVFoundation-free
model: an ordered list of `EditorClip`s (trim/speed/rotation/crop/color
grade/effect/transition), an optional picture-in-picture layer, titles,
captions, and audio tracks. `VideoCompositionBuilder`
(`Services/Editor/VideoCompositionBuilder.swift`) turns that into a real
`AVMutableComposition` + `AVMutableVideoComposition`:

- Clips alternate across two composition video tracks so adjacent clips can
  overlap (for cross-dissolve/fade transitions) without colliding on one track.
- A custom `AVVideoCompositing` (`EditorVideoCompositor.swift`) composites every
  active track per frame — applying crop, rotation, Ken-Burns zoom,
  picture-in-picture placement, and per-clip Core Image effects
  (`VideoEffectRenderer.swift`, built on the typed `CIFilterBuiltins` API rather
  than string-keyed `CIFilter(name:)` to avoid a wrong-key runtime crash) —
  because a custom compositor has to do all of that compositing itself; it
  doesn't get the built-in compositor's layer-instruction handling for free.
- Titles and captions are burned in via `AVVideoCompositionCoreAnimationTool`
  (`CATextLayer`s with keyframed opacity), independent of the custom compositor.
- Export (`VideoExporting.swift`) reuses the same composition through
  `AVAssetExportSession`, so what you preview is what you export.
- Automatic captions (`CaptionGenerating.swift`) are real, on-device
  `SFSpeechRecognizer` transcription grouped into cues — not simulated.
- Narration (`Services/Audio/NarrationSynthesizing.swift`) is real, on-device
  `AVSpeechSynthesizer` output mixed in via `AudioMixBuilder`.

**Known limitations, stated plainly:**

- The crop/rotate/zoom/PiP transform geometry (`VideoGeometry.swift`) and the
  custom compositor's coordinate-space handling were written carefully but
  **have not been visually verified on a device or simulator** — this
  environment has no Xcode toolchain to run it. Treat this as the first thing
  to QA by eye before shipping.
- Crop is fixed-aspect presets (1:1, 9:16, 4:5), not a free-drag rectangle.
- "Choose bitrate" is implemented as an `AVAssetExportSession` quality preset
  tier (Standard/High/Maximum), not a literal bits-per-second value —
  `AVAssetExportSession` doesn't expose that; true custom bitrate needs an
  `AVAssetWriter` pipeline instead.
- Atmospheric/particle VFX (fire, smoke, fog, rain, snow, lightning, particles,
  dust) and background music/ambient loops have real, working *pipelines*
  (`VFXOverlayLibrary`, `MockMusicLibrary`, `AmbientSoundLibrary`) but resolve
  every asset lookup to `nil` on purpose: this build doesn't bundle or license
  any overlay footage or audio files. Selecting them in the editor is
  currently a no-op rather than a silent wrong result — wiring real content
  means bundling (or streaming) licensed assets and pointing these lookups at
  them.
- Voice cloning isn't implemented (only straightforward TTS narration).

## Backend server

`Backend/` is a separate Vapor (Swift on the server) package implementing the
REST contract the client's `Endpoint.swift` already defines: JWT auth
(bcrypt-hashed passwords), a real token-bucket rate limiter, a real
keyword-based content moderation filter, Fluent/SQLite persistence with
migrations, subscription-credit enforcement, and a provider abstraction
mirroring the client's so a real AI vendor is a new conforming type, not a
rewrite. See `Backend/README.md` for endpoints and setup.

**This has been written but never built or run** — no Swift toolchain or SPM
network access existed in this environment. The design is complete and real;
the risk is purely whether specific Vapor/JWT API calls match the package
versions that actually resolve (that ecosystem's API has shifted over time).
`.github/workflows/backend-ci.yml` builds and tests it for real on push,
which is where that gets verified.

## What's not yet built

- Sign in with Apple / Google token verification on the backend, and any real
  AI video/thumbnail provider — both need credentials/registrations only the
  app's owner can obtain (see `Backend/README.md`).
- Deployment or hosting of the backend anywhere — it only runs locally today.
- Cloud sync and version history persistence.
- Launch screen art (currently the system default) and a full accessibility
  audit (Dynamic Type at largest sizes, VoiceOver rotor/reading order, contrast
  in both themes) — a first pass exists (app icon, iPad sidebar navigation
  that actually switches views, combined VoiceOver labels on icon+text
  controls), but it hasn't been exhaustively audited.

## Folder layout

```
AIVideoGenerator/
  project.yml                  XcodeGen spec (source of truth for the Xcode project)
  Sources/AIVideoGenerator/
    App/                        Composition root, environment wiring, app entry point
    Core/
      Models/                   Generation domain models
      Models/Editor/            EditorProject, EditorClip, titles/captions/audio models
    DesignSystem/                Theme, typography, spacing, reusable components
    Networking/                  APIClient, Endpoint, NetworkError
    Services/
      Providers/                 AI provider protocols + mocks + registry
      Auth/                       Auth protocol, mock implementation, Keychain
      Persistence/                Project storage protocol + local implementation
      JobQueue/                   Generation queue manager + scene stitching
      Editor/                     Composition builder, custom compositor, effects,
                                   captions, export, Photos save, video import
      Audio/                      Audio mix builder, music catalog, narration synthesis
    Features/
      Home/, VideoGenerator/, Thumbnail/, Projects/, Auth/, Settings/, Editor/
  Tests/AIVideoGeneratorTests/
  Resources/                     Bundled Privacy Policy / Terms of Service
```
