import Foundation

/// A queued unit of work tracked by the `GenerationQueueManaging` service, covering
/// both video and thumbnail generation so the Home dashboard can show one unified queue.
struct GenerationJob: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var kind: Kind
    var title: String
    var status: Status
    var progress: Double
    var createdAt: Date
    var updatedAt: Date
    var estimatedCompletion: Date?
    var resultProjectID: UUID?
    var errorMessage: String?

    init(
        id: UUID = UUID(),
        kind: Kind,
        title: String,
        status: Status = .queued,
        progress: Double = 0,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        estimatedCompletion: Date? = nil,
        resultProjectID: UUID? = nil,
        errorMessage: String? = nil
    ) {
        self.id = id
        self.kind = kind
        self.title = title
        self.status = status
        self.progress = progress
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.estimatedCompletion = estimatedCompletion
        self.resultProjectID = resultProjectID
        self.errorMessage = errorMessage
    }

    enum Kind: String, Codable, Sendable {
        case video, thumbnail
    }

    enum Status: String, Codable, Sendable {
        case queued
        case generatingScenes
        case stitching
        case uploading
        case completed
        case failed
        case cancelled

        var isTerminal: Bool {
            self == .completed || self == .failed || self == .cancelled
        }

        var displayName: String {
            switch self {
            case .queued: return "Queued"
            case .generatingScenes: return "Generating"
            case .stitching: return "Stitching Scenes"
            case .uploading: return "Uploading"
            case .completed: return "Completed"
            case .failed: return "Failed"
            case .cancelled: return "Cancelled"
            }
        }
    }
}
