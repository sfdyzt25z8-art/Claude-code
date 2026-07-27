import Foundation

/// Owns the lifecycle of every in-flight generation job: decomposing long
/// requests into scenes, submitting scenes to the selected provider, polling
/// for progress, stitching completed scenes, and publishing a unified queue
/// the Home dashboard renders. Conforming types are actors/classes so the UI
/// can bind directly to a single shared instance via `@Observable`/`ObservableObject`.
@MainActor
protocol GenerationQueueManaging: AnyObject {
    var jobs: [GenerationJob] { get }

    @discardableResult
    func enqueueVideo(_ request: GenerationRequest) async throws -> GenerationJob

    @discardableResult
    func enqueueThumbnail(prompt: String, category: ThumbnailCategory, providerID: String) async throws -> GenerationJob

    func cancel(jobID: GenerationJob.ID)
}
