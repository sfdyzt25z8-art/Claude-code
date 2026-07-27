import Foundation

/// Visual style applied to an AI video or thumbnail generation request.
enum VideoStyle: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case photorealistic
    case cinematic
    case anime
    case cartoon
    case pixar
    case painting
    case oilPainting
    case watercolor
    case fantasy
    case threeD
    case clayAnimation
    case sketch
    case sciFi
    case documentary
    case commercial
    case musicVideo
    case nature
    case horror
    case history
    case educational
    case custom

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .photorealistic: return "Photorealistic"
        case .cinematic: return "Cinematic"
        case .anime: return "Anime"
        case .cartoon: return "Cartoon"
        case .pixar: return "Pixar"
        case .painting: return "Painting"
        case .oilPainting: return "Oil Painting"
        case .watercolor: return "Watercolor"
        case .fantasy: return "Fantasy"
        case .threeD: return "3D"
        case .clayAnimation: return "Clay Animation"
        case .sketch: return "Sketch"
        case .sciFi: return "Sci-Fi"
        case .documentary: return "Documentary"
        case .commercial: return "Commercial"
        case .musicVideo: return "Music Video"
        case .nature: return "Nature"
        case .horror: return "Horror"
        case .history: return "History"
        case .educational: return "Educational"
        case .custom: return "Custom Style"
        }
    }

    /// SF Symbol used to represent the style in pickers and chips.
    var symbolName: String {
        switch self {
        case .photorealistic: return "camera.aperture"
        case .cinematic: return "film"
        case .anime: return "sparkles"
        case .cartoon: return "face.smiling"
        case .pixar: return "cube.transparent"
        case .painting: return "paintpalette"
        case .oilPainting: return "paintbrush.pointed"
        case .watercolor: return "drop.fill"
        case .fantasy: return "wand.and.stars"
        case .threeD: return "cube"
        case .clayAnimation: return "hands.sparkles"
        case .sketch: return "pencil"
        case .sciFi: return "atom"
        case .documentary: return "video"
        case .commercial: return "megaphone"
        case .musicVideo: return "music.note"
        case .nature: return "leaf"
        case .horror: return "moon.stars"
        case .history: return "building.columns"
        case .educational: return "graduationcap"
        case .custom: return "slider.horizontal.3"
        }
    }
}
