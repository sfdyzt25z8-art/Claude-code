# AI Video Generator

A premium, Apple-style iOS/iPadOS app for generating, editing, and exporting
AI video and thumbnails — built with SwiftUI, MVVM, and Swift Concurrency.

## Highlights

- **AI Video Generator**: prompt → style (20+ options) → resolution/FPS/
  aspect ratio → duration up to **90 minutes** (auto scene-stitched with
  live progress) → camera moves & lighting → generate.
- **AI Prompt Assistant**: improve/expand/shorten/translate prompts, plus
  suggested styles, lighting, camera movements, moods, environments, and
  cinematic shots.
- **Thumbnail Generator**: category-aware thumbnails with AI-suggested
  layout, text placement, and contrast.
- **Video Editor**: trim, split, merge, crop, rotate, speed, transitions,
  titles, captions, color grading, effects, sound, and a real
  `AVMutableComposition`-based export pipeline (MP4/MOV/HEVC).
- **Projects**: folders, tags, search, favorites, version history, local
  persistence with a clean seam for cloud sync.
- **Auth**: Sign in with Apple, Google (OAuth via `ASWebAuthenticationSession`,
  no third-party SDK), and email/password with reset.
- **Multi-provider AI backend abstraction**: swap or add AI vendors from
  Settings without touching feature code; a fully functional local demo
  engine (`MockAIProvider`) means the app is explorable end-to-end before a
  production backend is connected.
- Dark/light mode, glassmorphism, adaptive iPhone/iPad layouts,
  accessibility support throughout.

## Getting Started

This repo ships source only (no checked-in `.xcodeproj`). Generate one with
[XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
brew install xcodegen
xcodegen generate
open AIVideoGenerator.xcodeproj
```

Requires Xcode 15+ targeting iOS 17.

Run the unit tests with `⌘U`, or:

```bash
xcodebuild test -scheme AIVideoGenerator -destination 'platform=iOS Simulator,name=iPhone 15'
```

See [`Docs/ARCHITECTURE.md`](Docs/ARCHITECTURE.md) for the module layout,
the AI provider abstraction, and known scaffold limitations.

## License

See [`LICENSE`](LICENSE).
