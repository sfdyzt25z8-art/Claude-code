import Foundation

/// One audio layer mixed into the exported video: background music, AI
/// narration, or an ambient loop. Multiple tracks may overlap; `volume` and
/// the fade durations are applied per-track at mix time by `AudioMixBuilder`.
struct AudioTrack: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var kind: Kind
    var sourceURL: URL
    var displayName: String
    var timelineStart: TimeInterval
    var duration: TimeInterval
    /// Trim offset within the source audio file, in seconds.
    var sourceTrimStart: TimeInterval
    /// Linear 0...1 volume multiplier.
    var volume: Double
    var fadeInDuration: TimeInterval
    var fadeOutDuration: TimeInterval
    var isMuted: Bool

    init(
        id: UUID = UUID(),
        kind: Kind,
        sourceURL: URL,
        displayName: String,
        timelineStart: TimeInterval = 0,
        duration: TimeInterval,
        sourceTrimStart: TimeInterval = 0,
        volume: Double = 1,
        fadeInDuration: TimeInterval = 0,
        fadeOutDuration: TimeInterval = 0,
        isMuted: Bool = false
    ) {
        self.id = id
        self.kind = kind
        self.sourceURL = sourceURL
        self.displayName = displayName
        self.timelineStart = timelineStart
        self.duration = duration
        self.sourceTrimStart = sourceTrimStart
        self.volume = volume
        self.fadeInDuration = fadeInDuration
        self.fadeOutDuration = fadeOutDuration
        self.isMuted = isMuted
    }

    enum Kind: String, CaseIterable, Identifiable, Codable, Sendable {
        case music, narration, ambient

        var id: String { rawValue }
        var displayName: String {
            switch self {
            case .music: return "Music"
            case .narration: return "Narration"
            case .ambient: return "Ambient"
            }
        }
    }
}

/// A royalty-free music or ambient-sound catalog entry offered in the Sound
/// picker. `AmbientSoundType` mirrors the spec's fixed ambience list; music is
/// open-ended and comes from `MusicLibraryProviding`.
enum AmbientSoundType: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case rain, fire, ocean, wind, city, animals, fantasy, sciFi

    var id: String { rawValue }
    var displayName: String {
        switch self {
        case .sciFi: return "Sci-Fi"
        default: return rawValue.capitalized
        }
    }

    var symbolName: String {
        switch self {
        case .rain: return "cloud.rain"
        case .fire: return "flame"
        case .ocean: return "water.waves"
        case .wind: return "wind"
        case .city: return "building.2"
        case .animals: return "pawprint"
        case .fantasy: return "wand.and.stars"
        case .sciFi: return "atom"
        }
    }
}
