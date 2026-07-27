import Foundation

/// Represents an in-flight or completed AI generation job tracked by the
/// on-device ``JobQueueService`` and displayed on the Home dashboard's
/// generation queue.
struct GenerationJob: Identifiable, Codable, Sendable, Equatable {
    enum Kind: String, Codable, Sendable, Hashable {
        case video, thumbnail
    }

    enum Status: String, Codable, Sendable, Hashable {
        case queued, generating, stitching, completed, failed, cancelled

        var isTerminal: Bool {
            switch self {
            case .completed, .failed, .cancelled: true
            case .queued, .generating, .stitching: false
            }
        }

        var displayName: String {
            switch self {
            case .queued: "Queued"
            case .generating: "Generating"
            case .stitching: "Stitching Scenes"
            case .completed: "Completed"
            case .failed: "Failed"
            case .cancelled: "Cancelled"
            }
        }
    }

    let id: UUID
    var kind: Kind
    var title: String
    var status: Status
    var progress: Double
    var scenes: [GeneratedScene]
    var createdAt: Date
    var estimatedCompletionAt: Date?
    var resultProjectID: UUID?
    var errorMessage: String?

    init(
        id: UUID = UUID(),
        kind: Kind,
        title: String,
        status: Status = .queued,
        progress: Double = 0,
        scenes: [GeneratedScene] = [],
        createdAt: Date = .now,
        estimatedCompletionAt: Date? = nil,
        resultProjectID: UUID? = nil,
        errorMessage: String? = nil
    ) {
        self.id = id
        self.kind = kind
        self.title = title
        self.status = status
        self.progress = progress
        self.scenes = scenes
        self.createdAt = createdAt
        self.estimatedCompletionAt = estimatedCompletionAt
        self.resultProjectID = resultProjectID
        self.errorMessage = errorMessage
    }
}
