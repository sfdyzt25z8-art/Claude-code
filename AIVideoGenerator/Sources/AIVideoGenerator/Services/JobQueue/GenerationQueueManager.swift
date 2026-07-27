import Foundation
import Observation

/// Default `GenerationQueueManaging` implementation. Each enqueued request is
/// decomposed into provider-sized scenes via `SceneDecomposer`, rendered with
/// bounded parallelism, and — for multi-scene scripts — stitched into a single
/// asset before the job is marked completed. Progress is republished after
/// every scene update so the Home dashboard's Generation Queue section stays live.
@MainActor
@Observable
final class GenerationQueueManager: GenerationQueueManaging {
    private(set) var jobs: [GenerationJob] = []

    private let providerRegistry: ProviderRegistry
    private let stitcher: VideoStitching
    private let projectStore: ProjectStoring
    private let maxParallelScenes: Int
    private var runningTasks: [GenerationJob.ID: Task<Void, Never>] = [:]

    init(
        providerRegistry: ProviderRegistry,
        stitcher: VideoStitching = PassthroughVideoStitcher(),
        projectStore: ProjectStoring,
        maxParallelScenes: Int = 3
    ) {
        self.providerRegistry = providerRegistry
        self.stitcher = stitcher
        self.projectStore = projectStore
        self.maxParallelScenes = maxParallelScenes
    }

    @discardableResult
    func enqueueVideo(_ request: GenerationRequest) async throws -> GenerationJob {
        guard let provider = providerRegistry.videoProvider(id: request.providerID) else {
            throw AppError.providerUnavailable(request.providerID)
        }

        let issues = request.validate()
        guard issues.isEmpty else {
            throw AppError.validation(issues.first?.message ?? "Invalid request.")
        }

        let script = SceneDecomposer.makeScript(for: request, providerMaxSceneDuration: provider.maxSingleSceneDuration)
        let eta = SceneDecomposer.estimatedCompletion(for: script, maxParallelScenes: maxParallelScenes)

        var job = GenerationJob(
            kind: .video,
            title: String(request.prompt.prefix(48)),
            status: .generatingScenes,
            estimatedCompletion: Date().addingTimeInterval(eta)
        )
        jobs.insert(job, at: 0)

        let task = Task { [weak self] in
            await self?.runVideoJob(jobID: job.id, script: script, provider: provider)
        }
        runningTasks[job.id] = task
        return job
    }

    @discardableResult
    func enqueueThumbnail(prompt: String, category: ThumbnailCategory, providerID: String) async throws -> GenerationJob {
        guard let provider = providerRegistry.thumbnailProvider(id: providerID) else {
            throw AppError.providerUnavailable(providerID)
        }

        var job = GenerationJob(kind: .thumbnail, title: String(prompt.prefix(48)), status: .generatingScenes)
        jobs.insert(job, at: 0)

        let task = Task { [weak self] in
            await self?.runThumbnailJob(jobID: job.id, prompt: prompt, category: category, provider: provider)
        }
        runningTasks[job.id] = task
        return job
    }

    func cancel(jobID: GenerationJob.ID) {
        runningTasks[jobID]?.cancel()
        runningTasks[jobID] = nil
        update(jobID: jobID) { $0.status = .cancelled }
    }

    // MARK: - Execution

    private func runVideoJob(jobID: GenerationJob.ID, script: SceneScript, provider: AIVideoProviding) async {
        var completedScenes: [GenerationScene] = []

        do {
            let batches = stride(from: 0, to: script.scenes.count, by: maxParallelScenes).map { start in
                Array(script.scenes[start..<min(start + maxParallelScenes, script.scenes.count)])
            }

            for batch in batches {
                try Task.checkCancellation()
                let results = try await withThrowingTaskGroup(of: GenerationScene.self) { group in
                    for scene in batch {
                        group.addTask {
                            try await Self.render(scene: scene, request: script.request, provider: provider)
                        }
                    }
                    var rendered: [GenerationScene] = []
                    for try await scene in group { rendered.append(scene) }
                    return rendered
                }
                completedScenes.append(contentsOf: results)
                let fraction = Double(completedScenes.count) / Double(script.scenes.count)
                update(jobID: jobID) { $0.progress = fraction }
            }

            update(jobID: jobID) { $0.status = script.isSingleScene ? .uploading : .stitching }

            let orderedScenes = completedScenes.sorted { $0.index < $1.index }
            let finalAsset = try await stitcher.stitch(scenes: orderedScenes)

            let project = VideoProject(
                name: script.request.prompt,
                kind: .video,
                prompt: script.request.prompt,
                style: script.request.style,
                resolution: script.request.resolution,
                aspectRatio: script.request.aspectRatio,
                duration: script.totalDuration,
                videoAssetURL: finalAsset
            )
            try await projectStore.save(project)

            update(jobID: jobID) {
                $0.status = .completed
                $0.progress = 1
                $0.resultProjectID = project.id
            }
        } catch is CancellationError {
            update(jobID: jobID) { $0.status = .cancelled }
        } catch {
            AppLogger.generation.error("Video job \(jobID) failed: \(error.localizedDescription)")
            update(jobID: jobID) {
                $0.status = .failed
                $0.errorMessage = (error as? LocalizedError)?.errorDescription ?? "Generation failed."
            }
        }
    }

    private func runThumbnailJob(
        jobID: GenerationJob.ID,
        prompt: String,
        category: ThumbnailCategory,
        provider: AIThumbnailProviding
    ) async {
        do {
            let result = try await provider.generateThumbnail(prompt: prompt, category: category)
            let project = VideoProject(
                name: prompt,
                kind: .thumbnail,
                prompt: prompt,
                style: .photorealistic,
                resolution: .p1080,
                aspectRatio: .widescreen,
                duration: 0,
                thumbnailAssetURL: result.assetURL
            )
            try await projectStore.save(project)
            update(jobID: jobID) {
                $0.status = .completed
                $0.progress = 1
                $0.resultProjectID = project.id
            }
        } catch {
            AppLogger.generation.error("Thumbnail job \(jobID) failed: \(error.localizedDescription)")
            update(jobID: jobID) {
                $0.status = .failed
                $0.errorMessage = (error as? LocalizedError)?.errorDescription ?? "Thumbnail generation failed."
            }
        }
    }

    private nonisolated static func render(
        scene: GenerationScene,
        request: GenerationRequest,
        provider: AIVideoProviding
    ) async throws -> GenerationScene {
        let handle = try await provider.submitScene(scene, request: request)
        var scene = scene
        scene.status = .rendering

        while true {
            try Task.checkCancellation()
            let status = try await provider.pollStatus(for: handle)
            switch status {
            case .rendering:
                try await Task.sleep(nanoseconds: 300_000_000)
            case .completed(let assetURL):
                scene.status = .completed
                scene.outputAssetURL = assetURL
                return scene
            case .failed(let reason):
                throw AppError.providerUnavailable(reason)
            }
        }
    }

    private func update(jobID: GenerationJob.ID, _ mutate: (inout GenerationJob) -> Void) {
        guard let index = jobs.firstIndex(where: { $0.id == jobID }) else { return }
        var job = jobs[index]
        mutate(&job)
        job.updatedAt = .now
        jobs[index] = job
    }
}

/// Stitches an ordered list of completed scene assets into a single output video.
protocol VideoStitching: Sendable {
    func stitch(scenes: [GenerationScene]) async throws -> URL
}

/// Placeholder stitcher used until the real AVFoundation/backend-based composition
/// pipeline is wired up: for a single scene it passes the asset through unchanged;
/// for multiple scenes it returns the first asset as a stand-in composite.
struct PassthroughVideoStitcher: VideoStitching {
    func stitch(scenes: [GenerationScene]) async throws -> URL {
        guard let first = scenes.first?.outputAssetURL else {
            throw AppError.unknown
        }
        return first
    }
}
