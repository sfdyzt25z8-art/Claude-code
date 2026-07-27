# AI Video Generator (iOS)

SwiftUI iOS app for generating videos and thumbnails from text prompts. See
[`/docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the architecture,
what's implemented, and what's still missing.

## Requirements

- Xcode 16+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)

## Setup

```sh
cd AIVideoGenerator
xcodegen generate
open AIVideoGenerator.xcodeproj
```

The `.xcodeproj` is generated from `project.yml` and is not committed to the
repository — regenerate it after pulling changes that touch `project.yml` or
add/remove source files.

## Running tests

```sh
xcodegen generate
xcodebuild test \
  -project AIVideoGenerator.xcodeproj \
  -scheme AIVideoGenerator \
  -destination "platform=iOS Simulator,name=iPhone 16"
```

CI (`.github/workflows/ios-ci.yml`) runs the same build/test steps on every
push and pull request.
