import Foundation
import Observation

/// Backs the full video creation flow: prompt entry, AI prompt-assist actions,
/// style/resolution/fps/aspect-ratio/duration/camera/lighting selection, and
/// submission to the `GenerationQueueManaging` queue. Long durations are handled
/// transparently — the view model just submits a `GenerationRequest`; scene
/// decomposition and stitching progress happen inside the queue manager.
@MainActor
@Observable
final class VideoGeneratorViewModel {
    var prompt: String = ""
    var negativePrompt: String = ""
    var style: VideoStyle = .cinematic
    var resolution: VideoResolution = .p1080
    var frameRate: FrameRate = .fps30
    var aspectRatio: VideoAspectRatio = .widescreen
    var durationSeconds: TimeInterval = 8
    var selectedCameraMovements: Set<CameraMovement> = []
    var selectedLightingStyles: Set<LightingStyle> = []

    private(set) var isSubmitting = false
    private(set) var isAssisting = false
    private(set) var submittedJob: GenerationJob?
    var lastError: AppError?

    let availableProviders: [AIVideoProviding]
    var selectedProviderID: String

    private let queueManager: GenerationQueueManaging
    private let promptAssistant: PromptAssisting

    init(
        queueManager: GenerationQueueManaging,
        promptAssistant: PromptAssisting,
        availableProviders: [AIVideoProviding]
    ) {
        self.queueManager = queueManager
        self.promptAssistant = promptAssistant
        self.availableProviders = availableProviders
        self.selectedProviderID = availableProviders.first?.id ?? "mock.studio"
    }

    var validationIssues: [GenerationRequest.ValidationIssue] {
        buildRequest().validate()
    }

    var canSubmit: Bool {
        validationIssues.isEmpty && !isSubmitting
    }

    /// Estimated completion time shown live as the user adjusts duration/resolution,
    /// computed against the currently selected provider's scene-length ceiling.
    var estimatedCompletion: TimeInterval {
        guard let provider = availableProviders.first(where: { $0.id == selectedProviderID }) else {
            return durationSeconds
        }
        let script = SceneDecomposer.makeScript(for: buildRequest(), providerMaxSceneDuration: provider.maxSingleSceneDuration)
        return SceneDecomposer.estimatedCompletion(for: script)
    }

    var willRequireSceneStitching: Bool {
        guard let provider = availableProviders.first(where: { $0.id == selectedProviderID }) else { return false }
        return durationSeconds > provider.maxSingleSceneDuration
    }

    func applyTemplate(_ template: PromptTemplate) {
        prompt = template.prompt
        style = template.style
    }

    func applyPromptAssist(_ action: PromptAssistAction) async {
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isAssisting = true
        defer { isAssisting = false }
        do {
            prompt = try await promptAssistant.rewrite(prompt: prompt, action: action)
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    func requestSuggestions() async {
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        do {
            async let styles = promptAssistant.suggestStyles(for: prompt)
            async let lighting = promptAssistant.suggestLighting(for: prompt)
            async let cameras = promptAssistant.suggestCameraMovements(for: prompt)

            let (suggestedStyles, suggestedLighting, suggestedCameras) = try await (styles, lighting, cameras)
            if let firstStyle = suggestedStyles.first { style = firstStyle }
            selectedLightingStyles.formUnion(suggestedLighting)
            selectedCameraMovements.formUnion(suggestedCameras)
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    @discardableResult
    func submit() async -> GenerationJob? {
        guard canSubmit else { return nil }
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            let job = try await queueManager.enqueueVideo(buildRequest())
            submittedJob = job
            return job
        } catch {
            lastError = error as? AppError ?? .unknown
            return nil
        }
    }

    private func buildRequest() -> GenerationRequest {
        GenerationRequest(
            prompt: prompt,
            negativePrompt: negativePrompt,
            style: style,
            resolution: resolution,
            frameRate: frameRate,
            aspectRatio: aspectRatio,
            requestedDuration: durationSeconds,
            cameraMovements: Array(selectedCameraMovements),
            lightingStyles: Array(selectedLightingStyles),
            providerID: selectedProviderID
        )
    }
}
