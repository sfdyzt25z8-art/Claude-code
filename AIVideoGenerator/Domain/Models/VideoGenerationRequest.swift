import Foundation

/// All parameters required to submit an AI video generation job.
///
/// This struct is provider-agnostic: `AIProviderRegistry` translates it into
/// whichever request shape the active ``VideoGenerationProviding`` backend expects.
struct VideoGenerationRequest: Identifiable, Codable, Sendable, Hashable {
    let id: UUID
    var prompt: String
    var negativePrompt: String
    var style: VideoStyle
    var resolution: VideoResolution
    var frameRate: VideoFrameRate
    var aspectRatio: VideoAspectRatio
    var duration: VideoDuration
    var cameraMovements: [CameraMovement]
    var lighting: LightingStyle
    var seed: Int?

    init(
        id: UUID = UUID(),
        prompt: String = "",
        negativePrompt: String = "",
        style: VideoStyle = .cinematic,
        resolution: VideoResolution = .r1080p,
        frameRate: VideoFrameRate = .fps30,
        aspectRatio: VideoAspectRatio = .widescreen,
        duration: VideoDuration = VideoDuration(seconds: 10),
        cameraMovements: [CameraMovement] = [],
        lighting: LightingStyle = .natural,
        seed: Int? = nil
    ) {
        self.id = id
        self.prompt = prompt
        self.negativePrompt = negativePrompt
        self.style = style
        self.resolution = resolution
        self.frameRate = frameRate
        self.aspectRatio = aspectRatio
        self.duration = duration
        self.cameraMovements = cameraMovements
        self.lighting = lighting
        self.seed = seed
    }

    var isValid: Bool {
        !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    /// Whether this request exceeds a single provider call and needs to be
    /// split into multiple scenes by the ``SceneStitchingPlanner``.
    func requiresStitching(providerMaxSceneSeconds: TimeInterval) -> Bool {
        duration.seconds > providerMaxSceneSeconds
    }
}

/// A single generated (or in-flight) scene that is part of a larger,
/// stitched-together video for long-duration requests.
struct GeneratedScene: Identifiable, Codable, Sendable, Equatable {
    enum Status: String, Codable, Sendable, Hashable {
        case queued, generating, completed, failed
    }

    let id: UUID
    var index: Int
    var prompt: String
    var duration: TimeInterval
    var status: Status
    var progress: Double
    var previewURL: URL?
    var videoURL: URL?

    init(id: UUID = UUID(), index: Int, prompt: String, duration: TimeInterval, status: Status = .queued, progress: Double = 0, previewURL: URL? = nil, videoURL: URL? = nil) {
        self.id = id
        self.index = index
        self.prompt = prompt
        self.duration = duration
        self.status = status
        self.progress = progress
        self.previewURL = previewURL
        self.videoURL = videoURL
    }
}

/// Plans how a long-duration request is broken into provider-sized scenes.
///
/// Providers typically cap a single generation call at a handful of seconds.
/// For requests up to 90 minutes, this planner slices the timeline into
/// evenly-sized scenes, each carrying a scene-specific continuation of the
/// prompt so the AI provider maintains narrative and visual continuity.
enum SceneStitchingPlanner {
    static func plan(for request: VideoGenerationRequest, providerMaxSceneSeconds: TimeInterval) -> [GeneratedScene] {
        let total = request.duration.seconds
        guard total > providerMaxSceneSeconds else {
            return [GeneratedScene(index: 0, prompt: request.prompt, duration: total)]
        }

        let sceneCount = Int((total / providerMaxSceneSeconds).rounded(.up))
        var scenes: [GeneratedScene] = []
        var remaining = total

        for index in 0..<sceneCount {
            let sceneDuration = min(providerMaxSceneSeconds, remaining)
            remaining -= sceneDuration
            let continuity = index == 0 ? request.prompt : "\(request.prompt) — continuation, scene \(index + 1) of \(sceneCount), maintain visual continuity"
            scenes.append(GeneratedScene(index: index, prompt: continuity, duration: sceneDuration))
        }
        return scenes
    }

    /// Rough wall-clock estimate for the whole stitched job, used to show
    /// the user an "estimated completion time" while scenes render.
    static func estimatedCompletion(sceneCount: Int, resolution: VideoResolution, secondsPerSceneOverhead: TimeInterval = 18) -> TimeInterval {
        Double(sceneCount) * secondsPerSceneOverhead * resolution.relativeCost
    }
}
