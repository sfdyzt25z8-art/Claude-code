import Foundation
import Combine

@MainActor
final class VideoGeneratorViewModel: ObservableObject {
    @Published var request: VideoGenerationRequest
    @Published private(set) var isSubmitting = false
    @Published private(set) var isAssisting = false
    @Published var toast: Toast?
    @Published private(set) var activeJobID: UUID?

    private let jobQueue: JobQueueService
    private let promptAssistant: PromptAssistantService
    private var cancellables = Set<AnyCancellable>()

    init(
        initialRequest: VideoGenerationRequest,
        jobQueue: JobQueueService,
        promptAssistant: PromptAssistantService,
        defaultResolution: VideoResolution,
        defaultFrameRate: VideoFrameRate
    ) {
        var request = initialRequest
        if initialRequest.resolution == .r1080p { request.resolution = defaultResolution }
        if initialRequest.frameRate == .fps30 { request.frameRate = defaultFrameRate }
        self.request = request
        self.jobQueue = jobQueue
        self.promptAssistant = promptAssistant

        // Forward job-queue changes so `activeJob` (which reads live off the
        // queue) triggers a re-render while a submitted job's progress updates.
        jobQueue.objectWillChange
            .sink { [weak self] _ in self?.objectWillChange.send() }
            .store(in: &cancellables)
    }

    /// The tracked job for this generator session, if one has been submitted.
    var activeJob: GenerationJob? {
        guard let activeJobID else { return nil }
        return jobQueue.jobs.first { $0.id == activeJobID }
    }

    func submit() {
        guard request.isValid, !isSubmitting else {
            if !request.isValid {
                toast = Toast(message: "Describe the video you want to generate first.", style: .error)
            }
            return
        }
        isSubmitting = true
        activeJobID = jobQueue.enqueueVideoGeneration(request)
        isSubmitting = false
    }

    func applyPromptAssist(_ action: PromptAssistAction) async {
        guard !request.prompt.isEmpty else {
            toast = Toast(message: "Write a prompt first.", style: .error)
            return
        }
        isAssisting = true
        defer { isAssisting = false }
        do {
            request.prompt = try await promptAssistant.assist(prompt: request.prompt, action: action)
        } catch {
            toast = Toast(message: error.localizedDescription, style: .error)
        }
    }

    func toggleCameraMovement(_ movement: CameraMovement) {
        if let index = request.cameraMovements.firstIndex(of: movement) {
            request.cameraMovements.remove(at: index)
        } else {
            request.cameraMovements.append(movement)
        }
    }

    func fetchSuggestions(for category: PromptSuggestionCategory) async -> [String] {
        (try? await promptAssistant.suggest(category: category, context: request.prompt)) ?? []
    }

    var estimatedCompletionText: String {
        guard request.duration.seconds > 12 else { return "~30 seconds" }
        let sceneCount = Int((request.duration.seconds / 12).rounded(.up))
        let seconds = SceneStitchingPlanner.estimatedCompletion(sceneCount: sceneCount, resolution: request.resolution)
        let minutes = max(1, Int(seconds / 60))
        return "~\(minutes) min · \(sceneCount) scenes"
    }
}
