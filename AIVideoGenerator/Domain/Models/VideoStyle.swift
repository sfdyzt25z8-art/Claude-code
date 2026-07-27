import Foundation

/// Visual rendering style applied to an AI video generation request.
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
        case .photorealistic: "Photorealistic"
        case .cinematic: "Cinematic"
        case .anime: "Anime"
        case .cartoon: "Cartoon"
        case .pixar: "Pixar"
        case .painting: "Painting"
        case .oilPainting: "Oil Painting"
        case .watercolor: "Watercolor"
        case .fantasy: "Fantasy"
        case .threeD: "3D"
        case .clayAnimation: "Clay Animation"
        case .sketch: "Sketch"
        case .sciFi: "Sci-Fi"
        case .documentary: "Documentary"
        case .commercial: "Commercial"
        case .musicVideo: "Music Video"
        case .nature: "Nature"
        case .horror: "Horror"
        case .history: "History"
        case .educational: "Educational"
        case .custom: "Custom Style"
        }
    }

    var systemImage: String {
        switch self {
        case .photorealistic: "camera.aperture"
        case .cinematic: "film"
        case .anime: "sparkles.tv"
        case .cartoon: "face.smiling"
        case .pixar: "cube.transparent"
        case .painting: "paintpalette"
        case .oilPainting: "paintbrush.pointed"
        case .watercolor: "drop"
        case .fantasy: "wand.and.stars"
        case .threeD: "cube"
        case .clayAnimation: "hand.raised"
        case .sketch: "pencil"
        case .sciFi: "atom"
        case .documentary: "video.badge.checkmark"
        case .commercial: "megaphone"
        case .musicVideo: "music.note"
        case .nature: "leaf"
        case .horror: "moon.stars"
        case .history: "building.columns"
        case .educational: "graduationcap"
        case .custom: "slider.horizontal.3"
        }
    }
}

/// Preview thumbnail-oriented style categories for the Thumbnail Generator.
enum ThumbnailStyle: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case realistic, gaming, anime, cartoon, moviePoster, technology, business, education, travel, cooking, fitness

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .realistic: "Realistic"
        case .gaming: "Gaming"
        case .anime: "Anime"
        case .cartoon: "Cartoon"
        case .moviePoster: "Movie Poster"
        case .technology: "Technology"
        case .business: "Business"
        case .education: "Education"
        case .travel: "Travel"
        case .cooking: "Cooking"
        case .fitness: "Fitness"
        }
    }

    var systemImage: String {
        switch self {
        case .realistic: "camera"
        case .gaming: "gamecontroller"
        case .anime: "sparkles"
        case .cartoon: "face.smiling"
        case .moviePoster: "film"
        case .technology: "cpu"
        case .business: "briefcase"
        case .education: "book"
        case .travel: "airplane"
        case .cooking: "fork.knife"
        case .fitness: "figure.run"
        }
    }
}
