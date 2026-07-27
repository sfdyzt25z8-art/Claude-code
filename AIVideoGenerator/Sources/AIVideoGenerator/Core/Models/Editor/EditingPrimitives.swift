import Foundation

/// How one clip hands off to the next. Implemented purely with opacity ramps
/// on the composited layers (no mask/wipe geometry), which keeps every case
/// here renderable by `EditorVideoCompositor` without bespoke per-transition code.
enum TransitionType: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case cut
    case crossDissolve
    case fadeToBlack
    case fadeToWhite

    var id: String { rawValue }
    var isNone: Bool { self == .cut }

    var displayName: String {
        switch self {
        case .cut: return "Cut"
        case .crossDissolve: return "Cross Dissolve"
        case .fadeToBlack: return "Fade to Black"
        case .fadeToWhite: return "Fade to White"
        }
    }

    var symbolName: String {
        switch self {
        case .cut: return "scissors"
        case .crossDissolve: return "square.2.layers.3d"
        case .fadeToBlack: return "circle.lefthalf.filled"
        case .fadeToWhite: return "circle.righthalf.filled"
        }
    }
}

/// A text overlay burned into the video via `AVVideoCompositionCoreAnimationTool`.
struct TitleOverlay: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var text: String
    var timelineStart: TimeInterval
    var duration: TimeInterval
    /// Normalized (0...1) position of the text's center within the frame.
    var position: CGPoint
    var fontSize: CGFloat
    var colorHex: String
    var alignment: TextAlignment
    var style: TitleStyle

    init(
        id: UUID = UUID(),
        text: String,
        timelineStart: TimeInterval,
        duration: TimeInterval = 3,
        position: CGPoint = CGPoint(x: 0.5, y: 0.85),
        fontSize: CGFloat = 44,
        colorHex: String = "#FFFFFF",
        alignment: TextAlignment = .center,
        style: TitleStyle = .bold
    ) {
        self.id = id
        self.text = text
        self.timelineStart = timelineStart
        self.duration = duration
        self.position = position
        self.fontSize = fontSize
        self.colorHex = colorHex
        self.alignment = alignment
        self.style = style
    }

    enum TextAlignment: String, CaseIterable, Codable, Sendable { case left, center, right }

    enum TitleStyle: String, CaseIterable, Identifiable, Codable, Sendable {
        case bold, elegant, minimal, outlined, subtitle
        var id: String { rawValue }
        var displayName: String { rawValue.capitalized }
    }
}

/// One caption/subtitle cue. Editable manually or produced in bulk by a
/// `CaptionGenerating` implementation (real speech-to-text or a mock).
struct CaptionCue: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var text: String
    var timelineStart: TimeInterval
    var timelineEnd: TimeInterval
    var languageCode: String

    init(
        id: UUID = UUID(),
        text: String,
        timelineStart: TimeInterval,
        timelineEnd: TimeInterval,
        languageCode: String = "en-US"
    ) {
        self.id = id
        self.text = text
        self.timelineStart = timelineStart
        self.timelineEnd = timelineEnd
        self.languageCode = languageCode
    }

    var duration: TimeInterval { max(timelineEnd - timelineStart, 0) }
}

/// Color grading parameters mapped directly onto `CIColorControls` /
/// `CITemperatureAndTint` at render time — a real, if intentionally simple,
/// grading pipeline rather than a fixed LUT image.
struct ColorGradeSettings: Codable, Equatable, Sendable {
    /// -1...1, maps to CIColorControls brightness (-1...1 already).
    var brightness: Double
    /// 0...4, maps to CIColorControls contrast (1.0 = unchanged).
    var contrast: Double
    /// 0...2, maps to CIColorControls saturation (1.0 = unchanged).
    var saturation: Double
    /// 2000...12000 Kelvin, maps to CITemperatureAndTint's neutral temperature (6500 = unchanged).
    var temperature: Double
    /// -100...100, maps to CITemperatureAndTint's neutral tint (0 = unchanged).
    var tint: Double

    static let neutral = ColorGradeSettings(brightness: 0, contrast: 1, saturation: 1, temperature: 6500, tint: 0)

    static let cinematic = ColorGradeSettings(brightness: -0.02, contrast: 1.15, saturation: 0.9, temperature: 5600, tint: 4)
    static let warm = ColorGradeSettings(brightness: 0.02, contrast: 1.05, saturation: 1.1, temperature: 7800, tint: 0)
    static let cool = ColorGradeSettings(brightness: 0, contrast: 1.05, saturation: 0.95, temperature: 5000, tint: -6)
    static let vintage = ColorGradeSettings(brightness: 0.03, contrast: 0.9, saturation: 0.75, temperature: 6900, tint: 8)
    static let blackAndWhite = ColorGradeSettings(brightness: 0, contrast: 1.1, saturation: 0, temperature: 6500, tint: 0)

    static let presets: [(name: String, settings: ColorGradeSettings)] = [
        ("Neutral", .neutral),
        ("Cinematic", .cinematic),
        ("Warm", .warm),
        ("Cool", .cool),
        ("Vintage", .vintage),
        ("Black & White", .blackAndWhite)
    ]

    var isNeutral: Bool { self == .neutral }
}

/// Per-frame visual effects implemented as real Core Image filter chains in
/// `VideoEffectRenderer` — no bundled media required.
enum VideoEffectType: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case vignette
    case filmGrain
    case glow
    case bloom
    case motionBlur
    case cameraShake
    case lensFlare
    case depthOfField

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .vignette: return "Vignette"
        case .filmGrain: return "Film Grain"
        case .glow: return "Glow"
        case .bloom: return "Bloom"
        case .motionBlur: return "Motion Blur"
        case .cameraShake: return "Camera Shake"
        case .lensFlare: return "Lens Flare"
        case .depthOfField: return "Depth of Field"
        }
    }

    var symbolName: String {
        switch self {
        case .vignette: return "circle.dashed"
        case .filmGrain: return "film"
        case .glow: return "sparkles"
        case .bloom: return "sun.max"
        case .motionBlur: return "wind"
        case .cameraShake: return "camera.metering.center.weighted"
        case .lensFlare: return "sun.min"
        case .depthOfField: return "camera.aperture"
        }
    }
}

/// Atmospheric/particle effects (fire, smoke, weather, particles) composited
/// as a pre-rendered overlay clip with a blend mode, rather than simulated at
/// runtime. **No overlay footage ships with the app yet** — `VFXOverlayLibrary`
/// documents exactly what needs to be bundled (or fetched) before these
/// render as anything other than a no-op; see its doc comment.
enum VFXOverlayType: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case fire, smoke, fog, rain, snow, lightning, particles, dust

    var id: String { rawValue }
    var displayName: String { rawValue.capitalized }

    var symbolName: String {
        switch self {
        case .fire: return "flame"
        case .smoke: return "smoke"
        case .fog: return "cloud.fog"
        case .rain: return "cloud.rain"
        case .snow: return "cloud.snow"
        case .lightning: return "cloud.bolt"
        case .particles: return "sparkles"
        case .dust: return "aqi.medium"
        }
    }

    var recommendedBlendMode: OverlayBlendMode {
        switch self {
        case .fire, .lightning: return .screen
        case .smoke, .fog, .dust: return .softLight
        case .rain, .snow, .particles: return .screen
        }
    }
}

enum OverlayBlendMode: String, Codable, Sendable {
    case screen, softLight, add, multiply
}

/// Looks up the bundled overlay asset (if any) for a `VFXOverlayType`. Today
/// this always returns `nil`: shipping real fire/smoke/rain/snow/etc. requires
/// bundling (or downloading) licensed, loopable overlay footage, which this
/// build does not include. `VideoCompositionBuilder` skips overlay compositing
/// entirely when this returns `nil`, so selecting a VFX in the editor is a
/// no-op today rather than a silent wrong result.
enum VFXOverlayLibrary {
    static func assetURL(for type: VFXOverlayType) -> URL? {
        Bundle.main.url(forResource: type.rawValue, withExtension: "mov", subdirectory: "VFXOverlays")
    }
}
