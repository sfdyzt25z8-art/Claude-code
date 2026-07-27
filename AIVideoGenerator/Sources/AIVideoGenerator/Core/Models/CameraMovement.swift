import Foundation

/// Camera movement directive passed to the generation provider as part of the prompt payload.
enum CameraMovement: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case slowZoom
    case fastZoom
    case pan
    case orbit
    case drone
    case trackingShot
    case handheld
    case steadicam
    case crane
    case firstPerson
    case cinematicDolly

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .slowZoom: return "Slow Zoom"
        case .fastZoom: return "Fast Zoom"
        case .pan: return "Pan"
        case .orbit: return "Orbit"
        case .drone: return "Drone"
        case .trackingShot: return "Tracking Shot"
        case .handheld: return "Handheld"
        case .steadicam: return "Steadicam"
        case .crane: return "Crane"
        case .firstPerson: return "First Person"
        case .cinematicDolly: return "Cinematic Dolly"
        }
    }

    var symbolName: String {
        switch self {
        case .slowZoom, .fastZoom: return "arrow.up.left.and.arrow.down.right.circle"
        case .pan: return "arrow.left.and.right"
        case .orbit: return "arrow.triangle.2.circlepath.circle"
        case .drone: return "airplane"
        case .trackingShot: return "figure.walk.motion"
        case .handheld: return "hand.raised"
        case .steadicam: return "figure.walk"
        case .crane: return "arrow.up.to.line"
        case .firstPerson: return "eye"
        case .cinematicDolly: return "video.and.waveform"
        }
    }
}

/// Lighting mood applied to a generation request.
enum LightingStyle: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case goldenHour
    case sunrise
    case sunset
    case night
    case studio
    case volumetric
    case neon
    case natural
    case moonlight
    case firelight

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .goldenHour: return "Golden Hour"
        case .sunrise: return "Sunrise"
        case .sunset: return "Sunset"
        case .night: return "Night"
        case .studio: return "Studio"
        case .volumetric: return "Volumetric"
        case .neon: return "Neon"
        case .natural: return "Natural"
        case .moonlight: return "Moonlight"
        case .firelight: return "Firelight"
        }
    }

    var symbolName: String {
        switch self {
        case .goldenHour, .sunset: return "sun.horizon"
        case .sunrise: return "sunrise"
        case .night, .moonlight: return "moon.stars"
        case .studio: return "lightbulb"
        case .volumetric: return "cloud.sun"
        case .neon: return "bolt.horizontal"
        case .natural: return "leaf"
        case .firelight: return "flame"
        }
    }
}
