import Foundation

/// Visual category for AI-generated thumbnails, used to bias layout/text/color suggestions.
enum ThumbnailCategory: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case realistic
    case gaming
    case anime
    case cartoon
    case moviePoster
    case technology
    case business
    case education
    case travel
    case cooking
    case fitness

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .realistic: return "Realistic"
        case .gaming: return "Gaming"
        case .anime: return "Anime"
        case .cartoon: return "Cartoon"
        case .moviePoster: return "Movie Poster"
        case .technology: return "Technology"
        case .business: return "Business"
        case .education: return "Education"
        case .travel: return "Travel"
        case .cooking: return "Cooking"
        case .fitness: return "Fitness"
        }
    }

    var symbolName: String {
        switch self {
        case .realistic: return "camera"
        case .gaming: return "gamecontroller"
        case .anime: return "sparkles"
        case .cartoon: return "face.smiling"
        case .moviePoster: return "film"
        case .technology: return "cpu"
        case .business: return "briefcase"
        case .education: return "graduationcap"
        case .travel: return "airplane"
        case .cooking: return "fork.knife"
        case .fitness: return "figure.run"
        }
    }
}

/// Suggested text/logo placement region for a generated thumbnail, expressed as
/// a unit-square anchor so it can be mapped onto any output resolution.
enum ThumbnailTextPlacement: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case topLeft, topCenter, topRight
    case centerLeft, center, centerRight
    case bottomLeft, bottomCenter, bottomRight

    var id: String { rawValue }

    var unitAnchor: CGPoint {
        switch self {
        case .topLeft: return CGPoint(x: 0.08, y: 0.12)
        case .topCenter: return CGPoint(x: 0.5, y: 0.12)
        case .topRight: return CGPoint(x: 0.92, y: 0.12)
        case .centerLeft: return CGPoint(x: 0.08, y: 0.5)
        case .center: return CGPoint(x: 0.5, y: 0.5)
        case .centerRight: return CGPoint(x: 0.92, y: 0.5)
        case .bottomLeft: return CGPoint(x: 0.08, y: 0.88)
        case .bottomCenter: return CGPoint(x: 0.5, y: 0.88)
        case .bottomRight: return CGPoint(x: 0.92, y: 0.88)
        }
    }
}
