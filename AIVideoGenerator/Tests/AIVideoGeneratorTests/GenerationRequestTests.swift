import XCTest
@testable import AIVideoGenerator

final class GenerationRequestTests: XCTestCase {
    func testEmptyPromptFailsValidation() {
        let request = GenerationRequest(prompt: "", providerID: "mock.studio")
        XCTAssertTrue(request.validate().contains(.emptyPrompt))
    }

    func testShortPromptFailsValidation() {
        let request = GenerationRequest(prompt: "hi", providerID: "mock.studio")
        XCTAssertTrue(request.validate().contains(.promptTooShort))
    }

    func testValidPromptPassesValidation() {
        let request = GenerationRequest(prompt: "A cinematic shot of a mountain at sunrise", providerID: "mock.studio")
        XCTAssertTrue(request.validate().isEmpty)
    }

    func testDurationIsClampedToMaximum() {
        let request = GenerationRequest(prompt: "Valid prompt text", requestedDuration: 10_000, providerID: "mock.studio")
        XCTAssertEqual(request.requestedDuration, GenerationRequest.maximumDuration)
    }

    func testDurationIsClampedToMinimum() {
        let request = GenerationRequest(prompt: "Valid prompt text", requestedDuration: 0, providerID: "mock.studio")
        XCTAssertEqual(request.requestedDuration, GenerationRequest.minimumDuration)
    }
}

final class SceneDecomposerTests: XCTestCase {
    func testShortRequestIsNotDecomposed() {
        let request = GenerationRequest(prompt: "Valid prompt text", requestedDuration: 8, providerID: "mock.studio")
        let script = SceneDecomposer.makeScript(for: request, providerMaxSceneDuration: 12)
        XCTAssertTrue(script.isSingleScene)
        XCTAssertEqual(script.scenes.count, 1)
    }

    func testLongRequestIsDecomposedIntoMultipleScenes() {
        let request = GenerationRequest(prompt: "Valid prompt text", requestedDuration: 90 * 60, providerID: "mock.studio")
        let script = SceneDecomposer.makeScript(for: request, providerMaxSceneDuration: 12)

        XCTAssertGreaterThan(script.scenes.count, 1)
        XCTAssertEqual(script.totalDuration, request.requestedDuration, accuracy: 0.01)
        for scene in script.scenes {
            XCTAssertLessThanOrEqual(scene.duration, 12)
        }
    }

    func testEstimatedCompletionAccountsForParallelism() {
        let request = GenerationRequest(prompt: "Valid prompt text", requestedDuration: 60, providerID: "mock.studio")
        let script = SceneDecomposer.makeScript(for: request, providerMaxSceneDuration: 10)

        let serialEstimate = SceneDecomposer.estimatedCompletion(for: script, maxParallelScenes: 1)
        let parallelEstimate = SceneDecomposer.estimatedCompletion(for: script, maxParallelScenes: 6)

        XCTAssertLessThan(parallelEstimate, serialEstimate)
    }
}
