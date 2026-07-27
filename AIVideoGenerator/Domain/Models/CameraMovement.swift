import Foundation

enum CameraMovement: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case slowZoom, fastZoom, pan, orbit, drone, trackingShot, handheld, steadicam, crane, firstPerson, cinematicDolly

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .slowZoom: "Slow Zoom"
        case .fastZoom: "Fast Zoom"
        case .pan: "Pan"
        case .orbit: "Orbit"
        case .drone: "Drone"
        case .trackingShot: "Tracking Shot"
        case .handheld: "Handheld"
        case .steadicam: "Steadicam"
        case .crane: "Crane"
        case .firstPerson: "First Person"
        case .cinematicDolly: "Cinematic Dolly"
        }
    }

    var systemImage: String {
        switch self {
        case .slowZoom, .fastZoom: "arrow.up.left.and.arrow.down.right.circle"
        case .pan: "arrow.left.and.right.circle"
        case .orbit: "arrow.triangle.2.circlepath.circle"
        case .drone: "helicopter"
        case .trackingShot: "figure.walk.motion"
        case .handheld: "hand.raised.circle"
        case .steadicam: "figure.walk.circle"
        case .crane: "arrow.up.and.down.circle"
        case .firstPerson: "eye.circle"
        case .cinematicDolly: "video.circle"
        }
    }
}

enum LightingStyle: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case goldenHour, sunrise, sunset, night, studio, volumetric, neon, natural, moonlight, firelight

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .goldenHour: "Golden Hour"
        case .sunrise: "Sunrise"
        case .sunset: "Sunset"
        case .night: "Night"
        case .studio: "Studio"
        case .volumetric: "Volumetric"
        case .neon: "Neon"
        case .natural: "Natural"
        case .moonlight: "Moonlight"
        case .firelight: "Firelight"
        }
    }

    var systemImage: String {
        switch self {
        case .goldenHour: "sun.horizon"
        case .sunrise: "sunrise"
        case .sunset: "sunset"
        case .night: "moon.stars"
        case .studio: "lightbulb"
        case .volumetric: "cloud.sun"
        case .neon: "bolt.fill"
        case .natural: "sun.max"
        case .moonlight: "moon"
        case .firelight: "flame"
        }
    }
}
