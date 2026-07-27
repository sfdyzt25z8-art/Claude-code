import Foundation

/// A saved unit of work in the user's library — the result of a video or thumbnail
/// generation, plus any edits applied afterward. Persisted locally by `ProjectStoring`
/// and synced to the cloud when the user is signed in.
struct VideoProject: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var name: String
    var kind: GenerationJob.Kind
    var prompt: String
    var style: VideoStyle
    var resolution: VideoResolution
    var aspectRatio: VideoAspectRatio
    var duration: TimeInterval
    var thumbnailAssetURL: URL?
    var videoAssetURL: URL?
    var folder: String?
    var tags: [String]
    var isFavorite: Bool
    var createdAt: Date
    var updatedAt: Date
    var versionHistory: [ProjectVersion]

    init(
        id: UUID = UUID(),
        name: String,
        kind: GenerationJob.Kind,
        prompt: String,
        style: VideoStyle,
        resolution: VideoResolution,
        aspectRatio: VideoAspectRatio,
        duration: TimeInterval,
        thumbnailAssetURL: URL? = nil,
        videoAssetURL: URL? = nil,
        folder: String? = nil,
        tags: [String] = [],
        isFavorite: Bool = false,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        versionHistory: [ProjectVersion] = []
    ) {
        self.id = id
        self.name = name
        self.kind = kind
        self.prompt = prompt
        self.style = style
        self.resolution = resolution
        self.aspectRatio = aspectRatio
        self.duration = duration
        self.thumbnailAssetURL = thumbnailAssetURL
        self.videoAssetURL = videoAssetURL
        self.folder = folder
        self.tags = tags
        self.isFavorite = isFavorite
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.versionHistory = versionHistory
    }
}

/// A snapshot of a project's editable state, appended whenever a user-initiated
/// edit (trim, color grade, export settings, etc.) is committed.
struct ProjectVersion: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    let label: String
    let assetURL: URL?
    let savedAt: Date

    init(id: UUID = UUID(), label: String, assetURL: URL?, savedAt: Date = .now) {
        self.id = id
        self.label = label
        self.assetURL = assetURL
        self.savedAt = savedAt
    }
}
