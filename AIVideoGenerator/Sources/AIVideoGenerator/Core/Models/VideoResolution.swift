import Foundation

/// Output resolution tiers offered to the user. Availability of a given tier
/// is gated server-side by the active `SubscriptionPlan` and the capabilities
/// of the selected `AIVideoProviding` implementation.
enum VideoResolution: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case p720 = "720p"
    case p1080 = "1080p"
    case p1440 = "1440p"
    case p4K = "4K"

    var id: String { rawValue }

    var pixelHeight: Int {
        switch self {
        case .p720: return 720
        case .p1080: return 1080
        case .p1440: return 1440
        case .p4K: return 2160
        }
    }

    /// Relative rendering cost multiplier, used for ETA and credit estimation.
    var costMultiplier: Double {
        switch self {
        case .p720: return 1.0
        case .p1080: return 1.6
        case .p1440: return 2.4
        case .p4K: return 4.0
        }
    }
}

/// Target frame rate for generated footage.
enum FrameRate: Int, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case fps24 = 24
    case fps30 = 30
    case fps60 = 60

    var id: Int { rawValue }
    var displayName: String { "\(rawValue) FPS" }
}

/// Output aspect ratio, covering widescreen, vertical, square, and portrait formats.
enum VideoAspectRatio: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case widescreen = "16:9"
    case vertical = "9:16"
    case square = "1:1"
    case portrait = "4:5"
    case cinemaScope = "21:9"

    var id: String { rawValue }

    var displayName: String { rawValue }

    /// Width-to-height ratio used to lay out preview frames.
    var ratio: CGFloat {
        switch self {
        case .widescreen: return 16.0 / 9.0
        case .vertical: return 9.0 / 16.0
        case .square: return 1.0
        case .portrait: return 4.0 / 5.0
        case .cinemaScope: return 21.0 / 9.0
        }
    }
}

/// Export container/codec pairing requested at export time.
enum ExportFormat: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case mp4 = "MP4"
    case mov = "MOV"
    case hevc = "HEVC"

    var id: String { rawValue }
}
