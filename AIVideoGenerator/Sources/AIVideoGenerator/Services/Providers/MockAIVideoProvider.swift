import Foundation

/// A fully offline, deterministic stand-in for a real AI video provider. Used for
/// SwiftUI previews, unit tests, and local development before a real provider's
/// API credentials are configured. Simulates rendering progress over a short,
/// wall-clock delay proportional to the scene's requested duration.
struct MockAIVideoProvider: AIVideoProviding {
    let id = "mock.studio"
    let displayName = "Preview Studio (Mock)"
    let supportedStyles: Set<VideoStyle> = Set(VideoStyle.allCases)
    let supportedResolutions: Set<VideoResolution> = Set(VideoResolution.allCases)
    let maxSingleSceneDuration: TimeInterval = 12

    private actor JobStore {
        var progress: [String: Double] = [:]
        func setProgress(_ value: Double, for id: String) { progress[id] = value }
        func progress(for id: String) -> Double { progress[id] ?? 0 }
    }

    private let store = JobStore()

    func submitScene(_ scene: GenerationScene, request: GenerationRequest) async throws -> ProviderJobHandle {
        let handle = ProviderJobHandle(id: scene.id.uuidString, providerID: id)
        await store.setProgress(0, for: handle.id)
        return handle
    }

    func pollStatus(for handle: ProviderJobHandle) async throws -> ProviderJobStatus {
        let current = await store.progress(for: handle.id)
        let next = min(current + 0.34, 1.0)
        await store.setProgress(next, for: handle.id)

        if next >= 1.0 {
            let placeholderURL = URL(string: "https://example.com/mock-assets/\(handle.id).mp4")!
            return .completed(assetURL: placeholderURL)
        }
        return .rendering(progress: next)
    }

    func cancel(_ handle: ProviderJobHandle) async throws {
        await store.setProgress(0, for: handle.id)
    }
}

/// Offline stand-in for a thumbnail provider, mirroring `MockAIVideoProvider`.
struct MockAIThumbnailProvider: AIThumbnailProviding {
    let id = "mock.thumbnails"
    let displayName = "Preview Studio (Mock)"
    let supportedCategories: Set<ThumbnailCategory> = Set(ThumbnailCategory.allCases)

    func generateThumbnail(prompt: String, category: ThumbnailCategory) async throws -> ThumbnailResult {
        try await Task.sleep(nanoseconds: 400_000_000)
        return ThumbnailResult(
            assetURL: URL(string: "https://example.com/mock-assets/thumbnail-\(UUID().uuidString).png")!,
            suggestedTextPlacement: .bottomCenter,
            suggestedAccentColorHex: "#6C5CE7"
        )
    }
}
