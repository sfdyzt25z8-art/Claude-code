import Foundation
import CoreGraphics

enum VideoResolution: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case r720p, r1080p, r1440p, r4K

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .r720p: "720p"
        case .r1080p: "1080p"
        case .r1440p: "1440p"
        case .r4K: "4K"
        }
    }

    var pixelHeight: Int {
        switch self {
        case .r720p: 720
        case .r1080p: 1080
        case .r1440p: 1440
        case .r4K: 2160
        }
    }

    /// Relative render cost, used to estimate generation time and credit usage.
    var relativeCost: Double {
        switch self {
        case .r720p: 1.0
        case .r1080p: 1.6
        case .r1440p: 2.4
        case .r4K: 4.0
        }
    }
}

enum VideoFrameRate: Int, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case fps24 = 24, fps30 = 30, fps60 = 60

    var id: Int { rawValue }
    var displayName: String { "\(rawValue) FPS" }
}

enum VideoAspectRatio: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case widescreen = "16:9"
    case vertical = "9:16"
    case square = "1:1"
    case portrait = "4:5"
    case cinemaScope = "21:9"

    var id: String { rawValue }
    var displayName: String { rawValue }

    var ratio: CGFloat {
        switch self {
        case .widescreen: 16.0 / 9.0
        case .vertical: 9.0 / 16.0
        case .square: 1.0
        case .portrait: 4.0 / 5.0
        case .cinemaScope: 21.0 / 9.0
        }
    }

    var usageHint: String {
        switch self {
        case .widescreen: "YouTube, TV"
        case .vertical: "Reels, TikTok, Shorts"
        case .square: "Instagram Feed"
        case .portrait: "Instagram Portrait"
        case .cinemaScope: "Cinematic Film"
        }
    }
}

/// Requested output duration for a generation job. The maximum supported
/// duration is 90 minutes; anything beyond a single provider's native
/// generation limit is automatically split into multiple scenes and
/// stitched together (see ``SceneStitchingPlanner``).
struct VideoDuration: Codable, Sendable, Hashable {
    /// Duration in seconds, clamped to `(0, 5400]` (90 minutes).
    var seconds: TimeInterval

    static let maximum: TimeInterval = 90 * 60
    static let minimum: TimeInterval = 3

    init(seconds: TimeInterval) {
        self.seconds = min(max(seconds, Self.minimum), Self.maximum)
    }

    var formatted: String {
        let totalSeconds = Int(seconds)
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let secs = totalSeconds % 60

        if hours > 0 {
            return String(format: "%dh %dm", hours, minutes)
        } else if minutes > 0 {
            return String(format: "%dm %02ds", minutes, secs)
        } else {
            return String(format: "%ds", secs)
        }
    }

    static let presets: [TimeInterval] = [5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600, 5400]
}

enum ExportFormat: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case mp4, mov, hevc

    var id: String { rawValue }
    var displayName: String { rawValue.uppercased() }
    var fileExtension: String {
        switch self {
        case .mp4: "mp4"
        case .mov: "mov"
        case .hevc: "mov"
        }
    }
}

enum ExportBitrate: String, CaseIterable, Identifiable, Codable, Hashable, Sendable {
    case low, medium, high, maximum

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .low: "Low (Smaller File)"
        case .medium: "Medium"
        case .high: "High"
        case .maximum: "Maximum (Best Quality)"
        }
    }

    var megabitsPerSecond: Double {
        switch self {
        case .low: 4
        case .medium: 8
        case .high: 16
        case .maximum: 32
        }
    }
}
