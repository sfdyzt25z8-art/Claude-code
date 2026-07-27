import Foundation

/// Describes an AI video generation backend (e.g. a third-party model API) in a way
/// the rest of the app never needs vendor-specific knowledge of. New providers are
/// added by implementing this protocol and registering with `ProviderRegistry` —
/// nothing in the UI or job queue layer changes.
protocol AIVideoProviding: Sendable {
    /// Stable identifier persisted on `GenerationRequest.providerID` and in Settings.
    var id: String { get }
    var displayName: String { get }

    /// Styles this provider supports; used to filter the style picker per-provider.
    var supportedStyles: Set<VideoStyle> { get }
    var supportedResolutions: Set<VideoResolution> { get }

    /// The longest single continuous shot this provider can render. Requests beyond
    /// this are decomposed into multiple scenes by `SceneDecomposer` and stitched
    /// client- or server-side after each scene completes.
    var maxSingleSceneDuration: TimeInterval { get }

    /// Submits one provider-sized scene and returns a handle used to poll status.
    func submitScene(_ scene: GenerationScene, request: GenerationRequest) async throws -> ProviderJobHandle

    /// Polls the current status of a previously submitted scene.
    func pollStatus(for handle: ProviderJobHandle) async throws -> ProviderJobStatus

    func cancel(_ handle: ProviderJobHandle) async throws
}

/// Describes an AI thumbnail generation backend.
protocol AIThumbnailProviding: Sendable {
    var id: String { get }
    var displayName: String { get }
    var supportedCategories: Set<ThumbnailCategory> { get }

    func generateThumbnail(prompt: String, category: ThumbnailCategory) async throws -> ThumbnailResult
}

/// Opaque reference to work in progress at a provider, round-tripped back to
/// `pollStatus`/`cancel` without the caller needing to know its shape.
struct ProviderJobHandle: Identifiable, Sendable {
    let id: String
    let providerID: String
}

enum ProviderJobStatus: Sendable {
    case rendering(progress: Double)
    case completed(assetURL: URL)
    case failed(reason: String)
}

/// Result of a thumbnail generation, including layout/text-placement suggestions
/// so the editor can pre-populate a text overlay in a sensible position.
struct ThumbnailResult: Sendable {
    let assetURL: URL
    let suggestedTextPlacement: ThumbnailTextPlacement
    let suggestedAccentColorHex: String
}

/// Central lookup for all registered providers, used by pickers (Settings ▸ AI
/// Provider Selection) and by the generation queue to resolve a `providerID`
/// back into a live implementation. `@MainActor`-isolated (rather than its own
/// actor) so `DependencyContainer.live()` can register the built-in providers
/// synchronously at composition time instead of racing a detached `Task`.
@MainActor
final class ProviderRegistry {
    private var videoProviders: [String: AIVideoProviding] = [:]
    private var thumbnailProviders: [String: AIThumbnailProviding] = [:]

    func register(videoProvider: AIVideoProviding) {
        videoProviders[videoProvider.id] = videoProvider
    }

    func register(thumbnailProvider: AIThumbnailProviding) {
        thumbnailProviders[thumbnailProvider.id] = thumbnailProvider
    }

    func videoProvider(id: String) -> AIVideoProviding? { videoProviders[id] }
    func thumbnailProvider(id: String) -> AIThumbnailProviding? { thumbnailProviders[id] }
    func allVideoProviders() -> [AIVideoProviding] { Array(videoProviders.values) }
    func allThumbnailProviders() -> [AIThumbnailProviding] { Array(thumbnailProviders.values) }
}
