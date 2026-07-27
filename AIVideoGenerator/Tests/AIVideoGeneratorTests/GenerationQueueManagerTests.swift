import XCTest
@testable import AIVideoGenerator

@MainActor
final class GenerationQueueManagerTests: XCTestCase {
    private func makeManager() async -> (GenerationQueueManager, ProviderRegistry) {
        let registry = ProviderRegistry()
        registry.register(videoProvider: MockAIVideoProvider())
        registry.register(thumbnailProvider: MockAIThumbnailProvider())
        let store = LocalProjectStore(directory: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
        let manager = GenerationQueueManager(providerRegistry: registry, projectStore: store)
        return (manager, registry)
    }

    func testEnqueueVideoAddsJobToQueue() async throws {
        let (manager, _) = await makeManager()
        let request = GenerationRequest(prompt: "A serene lake at dawn", requestedDuration: 6, providerID: "mock.studio")

        let job = try await manager.enqueueVideo(request)

        XCTAssertEqual(manager.jobs.count, 1)
        XCTAssertEqual(manager.jobs.first?.id, job.id)
        XCTAssertEqual(job.kind, .video)
    }

    func testEnqueueVideoWithUnknownProviderThrows() async {
        let (manager, _) = await makeManager()
        let request = GenerationRequest(prompt: "A serene lake at dawn", providerID: "nonexistent.provider")

        do {
            _ = try await manager.enqueueVideo(request)
            XCTFail("Expected providerUnavailable error")
        } catch let error as AppError {
            if case .providerUnavailable = error {
                // expected
            } else {
                XCTFail("Unexpected AppError case: \(error)")
            }
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }

    func testInvalidRequestThrowsValidationError() async {
        let (manager, _) = await makeManager()
        let request = GenerationRequest(prompt: "", providerID: "mock.studio")

        do {
            _ = try await manager.enqueueVideo(request)
            XCTFail("Expected validation error")
        } catch let error as AppError {
            if case .validation = error {
                // expected
            } else {
                XCTFail("Unexpected AppError case: \(error)")
            }
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }

    func testJobEventuallyCompletes() async throws {
        let (manager, _) = await makeManager()
        let request = GenerationRequest(prompt: "A serene lake at dawn", requestedDuration: 4, providerID: "mock.studio")
        let job = try await manager.enqueueVideo(request)

        let didComplete = await waitForTerminalStatus(manager: manager, jobID: job.id)
        XCTAssertTrue(didComplete)
    }

    private func waitForTerminalStatus(manager: GenerationQueueManager, jobID: GenerationJob.ID, timeout: TimeInterval = 10) async -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if let job = manager.jobs.first(where: { $0.id == jobID }), job.status.isTerminal {
                return job.status == .completed
            }
            try? await Task.sleep(nanoseconds: 100_000_000)
        }
        return false
    }
}
