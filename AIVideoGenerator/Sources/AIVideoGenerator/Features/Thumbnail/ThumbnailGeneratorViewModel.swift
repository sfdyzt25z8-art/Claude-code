import Foundation
import Observation

/// Backs the thumbnail creation flow: prompt + category selection, submission to
/// the queue, and a completion state carrying the provider's suggested text
/// placement and accent color for a follow-up editor step.
@MainActor
@Observable
final class ThumbnailGeneratorViewModel {
    var prompt: String = ""
    var category: ThumbnailCategory = .realistic
    private(set) var isSubmitting = false
    private(set) var submittedJob: GenerationJob?
    var lastError: AppError?

    private let queueManager: GenerationQueueManaging
    private let providerID: String

    init(queueManager: GenerationQueueManaging, providerID: String) {
        self.queueManager = queueManager
        self.providerID = providerID
    }

    var canSubmit: Bool {
        !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSubmitting
    }

    @discardableResult
    func submit() async -> GenerationJob? {
        guard canSubmit else { return nil }
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            let job = try await queueManager.enqueueThumbnail(prompt: prompt, category: category, providerID: providerID)
            submittedJob = job
            return job
        } catch {
            lastError = error as? AppError ?? .unknown
            return nil
        }
    }
}
