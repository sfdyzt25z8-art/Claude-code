import Foundation

/// Identity and capability metadata shared by every AI backend the app can
/// talk to. Concrete providers (e.g. a first-party render farm, or
/// third-party video-generation APIs) conform to the capability protocols
/// below as appropriate — a provider need not support every capability.
protocol AIProvider: Identifiable, Sendable {
    var id: String { get }
    var displayName: String { get }
    var iconSystemImage: String { get }

    /// The longest single video clip this provider can generate in one call.
    /// Requests longer than this are automatically split into multiple
    /// scenes and stitched together by ``SceneStitchingPlanner``.
    var maxSceneSeconds: TimeInterval { get }
}

/// A discrete event emitted while a video generation job is in flight,
/// covering both single-scene and multi-scene (stitched) jobs.
enum GenerationEvent: Sendable, Equatable {
    case queued
    case sceneStarted(index: Int, total: Int)
    case sceneProgress(index: Int, total: Int, progress: Double)
    case sceneCompleted(GeneratedScene)
    case stitching(progress: Double)
    case completed(mediaURL: URL, thumbnailURL: URL?)
    case failed(message: String)
}

protocol VideoGenerationProviding: AIProvider {
    /// Streams generation lifecycle events for a request. For requests whose
    /// duration exceeds `maxSceneSeconds`, implementations are expected to
    /// internally plan and generate multiple scenes, emitting
    /// `.sceneStarted`/`.sceneCompleted` for each before a final `.stitching`
    /// and `.completed` event.
    func generateVideo(for request: VideoGenerationRequest) -> AsyncThrowingStream<GenerationEvent, Error>
}

protocol ThumbnailGenerationProviding: AIProvider {
    func generateThumbnails(for request: ThumbnailRequest, count: Int) async throws -> [ThumbnailResult]
}

enum PromptAssistAction: String, CaseIterable, Sendable, Hashable {
    case improve, expand, shorten, translate
}

enum PromptSuggestionCategory: String, CaseIterable, Sendable, Hashable {
    case style, lighting, cameraMovement, mood, environment, cinematicShot
}

protocol PromptAssistProviding: AIProvider {
    func assist(prompt: String, action: PromptAssistAction, targetLanguage: String?) async throws -> String
    func suggest(category: PromptSuggestionCategory, context: String) async throws -> [String]
}

/// Errors surfaced uniformly across all provider implementations so feature
/// code can present consistent, user-facing error states regardless of the
/// active backend.
enum ProviderError: LocalizedError, Sendable {
    case invalidRequest(String)
    case quotaExceeded
    case contentPolicyViolation(String)
    case network(String)
    case cancelled
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .invalidRequest(let message): message
        case .quotaExceeded: "You've reached your generation limit for this billing period. Upgrade your plan or wait for it to reset."
        case .contentPolicyViolation(let message): "This request was blocked by content moderation: \(message)"
        case .network(let message): "Network error: \(message)"
        case .cancelled: "Generation was cancelled."
        case .unknown(let message): message
        }
    }
}
