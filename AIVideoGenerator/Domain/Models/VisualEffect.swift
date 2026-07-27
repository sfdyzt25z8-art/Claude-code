import Foundation

enum VisualEffect: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case fire, smoke, fog, rain, snow, lightning, bloom, glow, lensFlare, particles, dust, cameraShake, filmGrain, colorLUT, depthOfField, motionBlur

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .fire: "Fire"
        case .smoke: "Smoke"
        case .fog: "Fog"
        case .rain: "Rain"
        case .snow: "Snow"
        case .lightning: "Lightning"
        case .bloom: "Bloom"
        case .glow: "Glow"
        case .lensFlare: "Lens Flare"
        case .particles: "Particles"
        case .dust: "Dust"
        case .cameraShake: "Camera Shake"
        case .filmGrain: "Film Grain"
        case .colorLUT: "Color LUTs"
        case .depthOfField: "Depth of Field"
        case .motionBlur: "Motion Blur"
        }
    }

    var systemImage: String {
        switch self {
        case .fire: "flame"
        case .smoke: "smoke"
        case .fog: "cloud.fog"
        case .rain: "cloud.rain"
        case .snow: "cloud.snow"
        case .lightning: "cloud.bolt"
        case .bloom: "sparkles"
        case .glow: "sun.dust"
        case .lensFlare: "camera.filters"
        case .particles: "circle.hexagongrid"
        case .dust: "wind"
        case .cameraShake: "camera.metering.center.weighted"
        case .filmGrain: "square.grid.3x3"
        case .colorLUT: "paintpalette"
        case .depthOfField: "camera.aperture"
        case .motionBlur: "wind.snow"
        }
    }
}

enum AmbientSound: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case rain, fire, ocean, wind, city, animals, fantasy, sciFi

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .rain: "Rain"
        case .fire: "Fire"
        case .ocean: "Ocean"
        case .wind: "Wind"
        case .city: "City"
        case .animals: "Animals"
        case .fantasy: "Fantasy"
        case .sciFi: "Sci-Fi"
        }
    }

    var systemImage: String {
        switch self {
        case .rain: "cloud.rain"
        case .fire: "flame"
        case .ocean: "water.waves"
        case .wind: "wind"
        case .city: "building.2"
        case .animals: "pawprint"
        case .fantasy: "wand.and.stars"
        case .sciFi: "atom"
        }
    }
}

/// A subtitle/caption cue with millisecond-accurate timing.
struct SubtitleCue: Identifiable, Codable, Sendable, Hashable {
    let id: UUID
    var startTime: TimeInterval
    var endTime: TimeInterval
    var text: String
    var languageCode: String

    init(id: UUID = UUID(), startTime: TimeInterval, endTime: TimeInterval, text: String, languageCode: String = "en") {
        self.id = id
        self.startTime = startTime
        self.endTime = endTime
        self.text = text
        self.languageCode = languageCode
    }
}

/// A music or narration track attached to a project's timeline.
struct SoundAsset: Identifiable, Codable, Sendable, Hashable {
    enum Kind: String, Codable, Sendable, Hashable {
        case backgroundMusic, narration, ambient, voiceClone
    }

    let id: UUID
    var kind: Kind
    var name: String
    var sourceURL: URL?
    var volume: Double
    var fadeInSeconds: Double
    var fadeOutSeconds: Double

    init(id: UUID = UUID(), kind: Kind, name: String, sourceURL: URL? = nil, volume: Double = 1.0, fadeInSeconds: Double = 0, fadeOutSeconds: Double = 0) {
        self.id = id
        self.kind = kind
        self.name = name
        self.sourceURL = sourceURL
        self.volume = volume
        self.fadeInSeconds = fadeInSeconds
        self.fadeOutSeconds = fadeOutSeconds
    }
}
