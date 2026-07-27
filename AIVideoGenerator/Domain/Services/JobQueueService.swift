import Foundation

/// Drives the app's on-device rendering pipeline: submits video and
/// thumbnail requests to the currently selected AI provider, tracks queued
/// and in-flight jobs for the Home dashboard's "Generation Queue", and
/// persists completed results into the project library.
///
/// Long-duration video requests transparently fan out into multiple scenes
/// (see `SceneStitchingPlanner`) and are reported to the UI as a single job
/// whose status transitions through `.generating` → `.stitching` → `.completed`.
@MainActor
final class JobQueueService: ObservableObject {
    @Published private(set) var jobs: [GenerationJob] = []

    private let providerRegistry: ProviderRegistry
    private let projectStore: ProjectStoreProtocol
    private var runningTasks: [UUID: Task<Void, Never>] = [:]

    init(providerRegistry: ProviderRegistry, projectStore: ProjectStoreProtocol) {
        self.providerRegistry = providerRegistry
        self.projectStore = projectStore
    }

    var activeJobs: [GenerationJob] {
        jobs.filter { !$0.status.isTerminal }
    }

    @discardableResult
    func enqueueVideoGeneration(_ request: VideoGenerationRequest) -> UUID {
        guard let provider = providerRegistry.activeVideoProvider else {
            let job = GenerationJob(kind: .video, title: request.prompt, status: .failed, errorMessage: "No video generation provider is configured.")
            jobs.insert(job, at: 0)
            return job.id
        }

        var job = GenerationJob(
            kind: .video,
            title: request.prompt.isEmpty ? "Untitled Video" : request.prompt,
            status: .queued,
            scenes: SceneStitchingPlanner.plan(for: request, providerMaxSceneSeconds: provider.maxSceneSeconds)
        )
        let sceneCount = job.scenes.count
        job.estimatedCompletionAt = Date().addingTimeInterval(
            SceneStitchingPlanner.estimatedCompletion(sceneCount: sceneCount, resolution: request.resolution)
        )
        jobs.insert(job, at: 0)
        let jobID = job.id

        runningTasks[jobID] = Task { [weak self] in
            await self?.runVideoJob(jobID: jobID, request: request, provider: provider)
        }

        return jobID
    }

    func cancelJob(_ id: UUID) {
        runningTasks[id]?.cancel()
        runningTasks[id] = nil
        updateJob(id) { $0.status = .cancelled }
    }

    private func runVideoJob(jobID: UUID, request: VideoGenerationRequest, provider: any VideoGenerationProviding) async {
        updateJob(jobID) { $0.status = .generating }

        do {
            for try await event in provider.generateVideo(for: request) {
                guard !Task.isCancelled else { break }

                switch event {
                case .queued:
                    break

                case .sceneStarted(let index, _):
                    updateJob(jobID) { job in
                        if job.scenes.indices.contains(index) {
                            job.scenes[index].status = .generating
                        }
                    }

                case .sceneProgress(let index, let total, let progress):
                    updateJob(jobID) { job in
                        if job.scenes.indices.contains(index) {
                            job.scenes[index].progress = progress
                        }
                        let completedWeight = Double(index) + progress
                        job.progress = completedWeight / Double(max(total, 1))
                    }

                case .sceneCompleted(let scene):
                    updateJob(jobID) { job in
                        if job.scenes.indices.contains(scene.index) {
                            job.scenes[scene.index] = scene
                        }
                    }

                case .stitching(let progress):
                    updateJob(jobID) { job in
                        job.status = .stitching
                        job.progress = progress
                    }

                case .completed(let mediaURL, let thumbnailURL):
                    let project = VideoProject(
                        title: request.prompt.isEmpty ? "Untitled Video" : request.prompt,
                        kind: .video,
                        thumbnailURL: thumbnailURL,
                        mediaURL: mediaURL,
                        request: request,
                        durationSeconds: request.duration.seconds
                    )
                    try? await projectStore.save(project)
                    updateJob(jobID) { job in
                        job.status = .completed
                        job.progress = 1
                        job.resultProjectID = project.id
                    }

                case .failed(let message):
                    updateJob(jobID) { job in
                        job.status = .failed
                        job.errorMessage = message
                    }
                }
            }
        } catch {
            updateJob(jobID) { job in
                job.status = .failed
                job.errorMessage = error.localizedDescription
            }
        }

        runningTasks[jobID] = nil
    }

    @discardableResult
    func enqueueThumbnailGeneration(_ request: ThumbnailRequest, count: Int = 4) -> UUID {
        guard let provider = providerRegistry.activeThumbnailProvider else {
            let job = GenerationJob(kind: .thumbnail, title: request.prompt, status: .failed, errorMessage: "No thumbnail generation provider is configured.")
            jobs.insert(job, at: 0)
            return job.id
        }

        let job = GenerationJob(kind: .thumbnail, title: request.prompt.isEmpty ? "Untitled Thumbnail" : request.prompt, status: .generating)
        jobs.insert(job, at: 0)
        let jobID = job.id

        runningTasks[jobID] = Task { [weak self] in
            await self?.runThumbnailJob(jobID: jobID, request: request, provider: provider, count: count)
        }

        return jobID
    }

    private func runThumbnailJob(jobID: UUID, request: ThumbnailRequest, provider: any ThumbnailGenerationProviding, count: Int) async {
        do {
            let results = try await provider.generateThumbnails(for: request, count: count)
            let project = VideoProject(
                title: request.titleText.isEmpty ? request.prompt : request.titleText,
                kind: .thumbnail,
                thumbnailURL: results.first?.imageURL
            )
            try? await projectStore.save(project)
            updateJob(jobID) { job in
                job.status = .completed
                job.progress = 1
                job.resultProjectID = project.id
            }
        } catch {
            updateJob(jobID) { job in
                job.status = .failed
                job.errorMessage = error.localizedDescription
            }
        }
        runningTasks[jobID] = nil
    }

    private func updateJob(_ id: UUID, mutate: (inout GenerationJob) -> Void) {
        guard let index = jobs.firstIndex(where: { $0.id == id }) else { return }
        mutate(&jobs[index])
    }
}
