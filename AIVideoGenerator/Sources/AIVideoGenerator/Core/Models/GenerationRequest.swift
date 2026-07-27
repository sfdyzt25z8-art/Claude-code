import Foundation

/// Everything needed to submit an AI video generation request to a provider.
///
/// A single request may exceed what any one provider can render in one shot
/// (providers today typically cap out well under a minute per shot). When
/// `requestedDuration` exceeds the active provider's `maxSingleSceneDuration`,
/// `SceneDecomposer` splits the request into a `SceneScript` of provider-sized
/// scenes that are generated independently and stitched together, while the
/// UI reports progress against the whole script rather than a single clip.
struct GenerationRequest: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var prompt: String
    var negativePrompt: String
    var style: VideoStyle
    var resolution: VideoResolution
    var frameRate: FrameRate
    var aspectRatio: VideoAspectRatio
    /// Total requested duration, in seconds. Product surfaces allow up to 90 minutes (5400s).
    var requestedDuration: TimeInterval
    var cameraMovements: [CameraMovement]
    var lightingStyles: [LightingStyle]
    var providerID: String
    var createdAt: Date

    static let maximumDuration: TimeInterval = 90 * 60
    static let minimumDuration: TimeInterval = 2

    init(
        id: UUID = UUID(),
        prompt: String,
        negativePrompt: String = "",
        style: VideoStyle = .cinematic,
        resolution: VideoResolution = .p1080,
        frameRate: FrameRate = .fps30,
        aspectRatio: VideoAspectRatio = .widescreen,
        requestedDuration: TimeInterval = 8,
        cameraMovements: [CameraMovement] = [],
        lightingStyles: [LightingStyle] = [],
        providerID: String,
        createdAt: Date = .now
    ) {
        self.id = id
        self.prompt = prompt
        self.negativePrompt = negativePrompt
        self.style = style
        self.resolution = resolution
        self.frameRate = frameRate
        self.aspectRatio = aspectRatio
        self.requestedDuration = min(max(requestedDuration, Self.minimumDuration), Self.maximumDuration)
        self.cameraMovements = cameraMovements
        self.lightingStyles = lightingStyles
        self.providerID = providerID
        self.createdAt = createdAt
    }

    /// Validation errors surfaced to the UI before submitting to a provider.
    func validate() -> [ValidationIssue] {
        var issues: [ValidationIssue] = []
        let trimmed = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            issues.append(.emptyPrompt)
        } else if trimmed.count < 8 {
            issues.append(.promptTooShort)
        }
        if requestedDuration < Self.minimumDuration || requestedDuration > Self.maximumDuration {
            issues.append(.durationOutOfRange)
        }
        return issues
    }

    enum ValidationIssue: String, Sendable {
        case emptyPrompt
        case promptTooShort
        case durationOutOfRange

        var message: String {
            switch self {
            case .emptyPrompt: return "Describe what you want to see before generating."
            case .promptTooShort: return "Add a bit more detail to your prompt for better results."
            case .durationOutOfRange: return "Duration must be between 2 seconds and 90 minutes."
            }
        }
    }
}

/// A single provider-sized scene within a decomposed `GenerationRequest`.
struct GenerationScene: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    let index: Int
    let prompt: String
    let duration: TimeInterval
    var status: SceneStatus
    var outputAssetURL: URL?

    init(
        id: UUID = UUID(),
        index: Int,
        prompt: String,
        duration: TimeInterval,
        status: SceneStatus = .pending,
        outputAssetURL: URL? = nil
    ) {
        self.id = id
        self.index = index
        self.prompt = prompt
        self.duration = duration
        self.status = status
        self.outputAssetURL = outputAssetURL
    }

    enum SceneStatus: String, Codable, Sendable {
        case pending, rendering, stitching, completed, failed
    }
}

/// A full multi-scene plan produced by `SceneDecomposer` for long-duration requests.
struct SceneScript: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    let request: GenerationRequest
    var scenes: [GenerationScene]

    init(id: UUID = UUID(), request: GenerationRequest, scenes: [GenerationScene]) {
        self.id = id
        self.request = request
        self.scenes = scenes
    }

    var totalDuration: TimeInterval { scenes.reduce(0) { $0 + $1.duration } }

    var completedScenes: Int { scenes.filter { $0.status == .completed }.count }

    var fractionComplete: Double {
        guard !scenes.isEmpty else { return 0 }
        return Double(completedScenes) / Double(scenes.count)
    }

    var isSingleScene: Bool { scenes.count <= 1 }
}

/// Splits a long-duration `GenerationRequest` into provider-sized scenes and estimates
/// a total completion time, so the UI can show a realistic progress/ETA before rendering starts.
enum SceneDecomposer {
    /// Builds a `SceneScript` for `request` given the maximum single-scene duration
    /// the target provider supports.
    static func makeScript(for request: GenerationRequest, providerMaxSceneDuration: TimeInterval) -> SceneScript {
        guard request.requestedDuration > providerMaxSceneDuration else {
            let scene = GenerationScene(index: 0, prompt: request.prompt, duration: request.requestedDuration)
            return SceneScript(request: request, scenes: [scene])
        }

        let sceneCount = Int((request.requestedDuration / providerMaxSceneDuration).rounded(.up))
        let evenDuration = request.requestedDuration / Double(sceneCount)

        let scenes = (0..<sceneCount).map { index in
            GenerationScene(
                index: index,
                prompt: continuationPrompt(basePrompt: request.prompt, sceneIndex: index, totalScenes: sceneCount),
                duration: evenDuration
            )
        }
        return SceneScript(request: request, scenes: scenes)
    }

    /// Estimated wall-clock completion time for a script, assuming scenes render with
    /// bounded parallelism on the backend job queue.
    static func estimatedCompletion(
        for script: SceneScript,
        secondsOfRenderPerSecondOfFootage: Double = 6,
        maxParallelScenes: Int = 3
    ) -> TimeInterval {
        let renderSeconds = script.scenes.map { $0.duration * secondsOfRenderPerSecondOfFootage }
        let batches = stride(from: 0, to: renderSeconds.count, by: maxParallelScenes).map { start -> TimeInterval in
            let end = min(start + maxParallelScenes, renderSeconds.count)
            return renderSeconds[start..<end].max() ?? 0
        }
        let stitchingOverhead = script.isSingleScene ? 0 : Double(script.scenes.count) * 1.5
        return batches.reduce(0, +) + stitchingOverhead
    }

    private static func continuationPrompt(basePrompt: String, sceneIndex: Int, totalScenes: Int) -> String {
        guard totalScenes > 1 else { return basePrompt }
        return "\(basePrompt) (continuous scene \(sceneIndex + 1) of \(totalScenes), maintaining character, setting, and lighting continuity)"
    }
}
