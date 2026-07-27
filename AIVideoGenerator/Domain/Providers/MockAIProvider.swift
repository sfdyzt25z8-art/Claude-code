import Foundation

/// A fully functional, self-contained AI backend used for local development,
/// SwiftUI previews, and App Store demo builds before a production provider
/// is wired in. It simulates realistic job timing, per-scene progress, and
/// automatic scene stitching for long-duration requests, so the entire UI
/// layer can be built and tested against real async event streams.
struct MockAIProvider: VideoGenerationProviding, ThumbnailGenerationProviding, PromptAssistProviding {
    let id = "mock.aivideogenerator"
    let displayName = "AI Video Generator (Demo Engine)"
    let iconSystemImage = "sparkles.rectangle.stack"

    /// Simulates a provider that can natively generate up to 12 seconds in a
    /// single call — long enough to be realistic, short enough to exercise
    /// the scene-stitching pipeline for anything longer.
    let maxSceneSeconds: TimeInterval = 12

    func generateVideo(for request: VideoGenerationRequest) -> AsyncThrowingStream<GenerationEvent, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    guard request.isValid else {
                        throw ProviderError.invalidRequest("Please describe the video you want to generate.")
                    }

                    continuation.yield(.queued)
                    try await Task.sleep(for: .milliseconds(400))

                    let scenes = SceneStitchingPlanner.plan(for: request, providerMaxSceneSeconds: maxSceneSeconds)
                    let total = scenes.count

                    for scene in scenes {
                        continuation.yield(.sceneStarted(index: scene.index, total: total))

                        let steps = 10
                        for step in 1...steps {
                            try Task.checkCancellation()
                            try await Task.sleep(for: .milliseconds(120))
                            let progress = Double(step) / Double(steps)
                            continuation.yield(.sceneProgress(index: scene.index, total: total, progress: progress))
                        }

                        var completedScene = scene
                        completedScene.status = .completed
                        completedScene.progress = 1
                        completedScene.videoURL = Self.placeholderMediaURL(seed: "\(request.id)-\(scene.index)")
                        completedScene.previewURL = Self.placeholderImageURL(seed: "\(request.id)-\(scene.index)")
                        continuation.yield(.sceneCompleted(completedScene))
                    }

                    if total > 1 {
                        let steps = 8
                        for step in 1...steps {
                            try Task.checkCancellation()
                            try await Task.sleep(for: .milliseconds(90))
                            continuation.yield(.stitching(progress: Double(step) / Double(steps)))
                        }
                    }

                    continuation.yield(.completed(
                        mediaURL: Self.placeholderMediaURL(seed: request.id.uuidString),
                        thumbnailURL: Self.placeholderImageURL(seed: request.id.uuidString)
                    ))
                    continuation.finish()
                } catch is CancellationError {
                    continuation.yield(.failed(message: ProviderError.cancelled.localizedDescription))
                    continuation.finish(throwing: ProviderError.cancelled)
                } catch {
                    continuation.yield(.failed(message: error.localizedDescription))
                    continuation.finish(throwing: error)
                }
            }

            continuation.onTermination = { _ in task.cancel() }
        }
    }

    func generateThumbnails(for request: ThumbnailRequest, count: Int) async throws -> [ThumbnailResult] {
        guard request.isValid else {
            throw ProviderError.invalidRequest("Please describe the thumbnail you want to generate.")
        }
        try await Task.sleep(for: .milliseconds(900))

        return (0..<count).map { index in
            let placement = ThumbnailResult.TextPlacement(
                x: 0.06,
                y: index.isMultiple(of: 2) ? 0.62 : 0.08,
                width: 0.88,
                height: 0.28,
                suggestedTextColorHex: index.isMultiple(of: 2) ? "#FFFFFF" : "#0B0B0F",
                suggestedBackdropOpacity: 0.35
            )
            return ThumbnailResult(
                imageURL: Self.placeholderImageURL(seed: "\(request.id)-\(index)"),
                titlePlacement: placement,
                dominantColorHex: ["#7A4AF9", "#F95879", "#22C55E", "#F59E0B"][index % 4],
                contrastScore: Double.random(in: 0.72...0.97)
            )
        }
    }

    func assist(prompt: String, action: PromptAssistAction, targetLanguage: String?) async throws -> String {
        try await Task.sleep(for: .milliseconds(500))
        let trimmed = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw ProviderError.invalidRequest("Write a prompt first so the assistant has something to work with.")
        }

        switch action {
        case .improve:
            return "\(trimmed), cinematic composition, rich detail, dynamic lighting, high production value"
        case .expand:
            return "\(trimmed). The scene unfolds with layered depth, atmospheric particles in the air, subtle camera drift, and a color palette that reinforces the mood, evoking a sense of scale and immersion."
        case .shorten:
            let words = trimmed.split(separator: " ")
            return words.prefix(max(6, words.count / 2)).joined(separator: " ")
        case .translate:
            let language = targetLanguage ?? "Spanish"
            return "[\(language)] \(trimmed)"
        }
    }

    func suggest(category: PromptSuggestionCategory, context: String) async throws -> [String] {
        try await Task.sleep(for: .milliseconds(350))
        switch category {
        case .style:
            return ["Cinematic", "Photorealistic", "Anime", "3D", "Documentary"]
        case .lighting:
            return ["Golden Hour", "Volumetric", "Neon", "Moonlight", "Studio"]
        case .cameraMovement:
            return ["Slow Zoom", "Drone", "Tracking Shot", "Cinematic Dolly", "Orbit"]
        case .mood:
            return ["Epic", "Mysterious", "Serene", "Tense", "Whimsical", "Melancholic"]
        case .environment:
            return ["Neon-lit cityscape", "Misty forest", "Desert canyon", "Underwater reef", "Space station"]
        case .cinematicShot:
            return ["Wide establishing shot", "Extreme close-up", "Low-angle hero shot", "Over-the-shoulder", "Bird's-eye view"]
        }
    }

    /// Deterministic placeholder media so previews and demo builds always
    /// have something to render. Replace with real provider CDN URLs.
    private static func placeholderMediaURL(seed: String) -> URL {
        URL(string: "https://example.com/aivideogenerator/render/\(seed).mp4")!
    }

    private static func placeholderImageURL(seed: String) -> URL {
        URL(string: "https://example.com/aivideogenerator/preview/\(seed).jpg")!
    }
}
