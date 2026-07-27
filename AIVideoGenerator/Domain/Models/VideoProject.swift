import Foundation

/// A saved project — either a generated video, a thumbnail set, or an
/// in-progress edit — surfaced in the Projects library and Home dashboard.
struct VideoProject: Identifiable, Codable, Sendable, Equatable, Hashable {
    enum Kind: String, Codable, Sendable, Hashable {
        case video, thumbnail
    }

    let id: UUID
    var title: String
    var kind: Kind
    var thumbnailURL: URL?
    var mediaURL: URL?
    var createdAt: Date
    var updatedAt: Date
    var isFavorite: Bool
    var folder: String?
    var tags: [String]
    var request: VideoGenerationRequest?
    var subtitles: [SubtitleCue]
    var soundAssets: [SoundAsset]
    var appliedEffects: [VisualEffect]
    var durationSeconds: TimeInterval
    var fileSizeBytes: Int64
    var versionHistory: [ProjectVersion]

    init(
        id: UUID = UUID(),
        title: String,
        kind: Kind,
        thumbnailURL: URL? = nil,
        mediaURL: URL? = nil,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        isFavorite: Bool = false,
        folder: String? = nil,
        tags: [String] = [],
        request: VideoGenerationRequest? = nil,
        subtitles: [SubtitleCue] = [],
        soundAssets: [SoundAsset] = [],
        appliedEffects: [VisualEffect] = [],
        durationSeconds: TimeInterval = 0,
        fileSizeBytes: Int64 = 0,
        versionHistory: [ProjectVersion] = []
    ) {
        self.id = id
        self.title = title
        self.kind = kind
        self.thumbnailURL = thumbnailURL
        self.mediaURL = mediaURL
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isFavorite = isFavorite
        self.folder = folder
        self.tags = tags
        self.request = request
        self.subtitles = subtitles
        self.soundAssets = soundAssets
        self.appliedEffects = appliedEffects
        self.durationSeconds = durationSeconds
        self.fileSizeBytes = fileSizeBytes
        self.versionHistory = versionHistory
    }
}

/// A snapshot of a project at a point in time, enabling the version history
/// feature in project management.
struct ProjectVersion: Identifiable, Codable, Sendable, Equatable, Hashable {
    let id: UUID
    var savedAt: Date
    var note: String
    var mediaURL: URL?

    init(id: UUID = UUID(), savedAt: Date = .now, note: String, mediaURL: URL? = nil) {
        self.id = id
        self.savedAt = savedAt
        self.note = note
        self.mediaURL = mediaURL
    }
}

/// A curated starting point offered on the Home dashboard's Templates row.
struct VideoTemplate: Identifiable, Codable, Sendable, Equatable, Hashable {
    let id: UUID
    var name: String
    var previewImageURL: URL?
    var style: VideoStyle
    var promptSeed: String
    var isTrending: Bool

    init(id: UUID = UUID(), name: String, previewImageURL: URL? = nil, style: VideoStyle, promptSeed: String, isTrending: Bool = false) {
        self.id = id
        self.name = name
        self.previewImageURL = previewImageURL
        self.style = style
        self.promptSeed = promptSeed
        self.isTrending = isTrending
    }
}
