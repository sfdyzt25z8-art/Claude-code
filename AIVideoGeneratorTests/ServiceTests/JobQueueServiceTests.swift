import XCTest
@testable import AIVideoGenerator

actor InMemoryProjectStore: ProjectStoreProtocol {
    private var storage: [UUID: VideoProject] = [:]

    func fetchAll() async throws -> [VideoProject] {
        Array(storage.values)
    }

    func project(id: UUID) async throws -> VideoProject? {
        storage[id]
    }

    func save(_ project: VideoProject) async throws {
        storage[project.id] = project
    }

    func delete(id: UUID) async throws {
        storage[id] = nil
    }
}

@MainActor
final class JobQueueServiceTests: XCTestCase {
    func testEnqueueVideoGenerationCompletesAndSavesProject() async throws {
        let provider = MockAIProvider()
        let registry = ProviderRegistry(
            videoProviders: [provider],
            thumbnailProviders: [provider],
            promptAssistProviders: [provider],
            userDefaults: UserDefaults(suiteName: #function)!
        )
        let projectStore = InMemoryProjectStore()
        let queue = JobQueueService(providerRegistry: registry, projectStore: projectStore)

        let request = VideoGenerationRequest(prompt: "A hot air balloon over mountains", duration: VideoDuration(seconds: 4))
        let jobID = queue.enqueueVideoGeneration(request)

        let deadline = Date().addingTimeInterval(5)
        while Date() < deadline {
            if let job = queue.jobs.first(where: { $0.id == jobID }), job.status.isTerminal {
                break
            }
            try await Task.sleep(for: .milliseconds(50))
        }

        let job = try XCTUnwrap(queue.jobs.first { $0.id == jobID })
        XCTAssertEqual(job.status, .completed)
        XCTAssertNotNil(job.resultProjectID)

        let savedProjects = try await projectStore.fetchAll()
        XCTAssertEqual(savedProjects.count, 1)
    }

    func testCancelJobMarksItCancelled() {
        let provider = MockAIProvider()
        let registry = ProviderRegistry(
            videoProviders: [provider],
            thumbnailProviders: [provider],
            promptAssistProviders: [provider],
            userDefaults: UserDefaults(suiteName: #function)!
        )
        let queue = JobQueueService(providerRegistry: registry, projectStore: InMemoryProjectStore())

        let request = VideoGenerationRequest(prompt: "A long documentary", duration: VideoDuration(seconds: 300))
        let jobID = queue.enqueueVideoGeneration(request)
        queue.cancelJob(jobID)

        let job = queue.jobs.first { $0.id == jobID }
        XCTAssertEqual(job?.status, .cancelled)
    }
}
