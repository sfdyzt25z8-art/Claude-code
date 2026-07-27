import XCTest
@testable import AIVideoGenerator

final class MockAIProviderTests: XCTestCase {
    func testGenerateVideoEmitsCompletionForShortRequest() async throws {
        let provider = MockAIProvider()
        let request = VideoGenerationRequest(prompt: "A cat surfing on a wave", duration: VideoDuration(seconds: 5))

        var sawCompletion = false
        for try await event in provider.generateVideo(for: request) {
            if case .completed = event {
                sawCompletion = true
            }
        }

        XCTAssertTrue(sawCompletion)
    }

    func testGenerateVideoRejectsEmptyPrompt() async {
        let provider = MockAIProvider()
        let request = VideoGenerationRequest(prompt: "")

        do {
            for try await _ in provider.generateVideo(for: request) {}
            XCTFail("Expected an invalid-request error to be thrown.")
        } catch {
            XCTAssertTrue(error is ProviderError)
        }
    }

    func testGenerateThumbnailsReturnsRequestedCount() async throws {
        let provider = MockAIProvider()
        let request = ThumbnailRequest(prompt: "A neon gaming setup", style: .gaming)

        let results = try await provider.generateThumbnails(for: request, count: 4)
        XCTAssertEqual(results.count, 4)
    }

    func testAssistImprovesPrompt() async throws {
        let provider = MockAIProvider()
        let improved = try await provider.assist(prompt: "a dog running", action: .improve, targetLanguage: nil)
        XCTAssertTrue(improved.contains("a dog running"))
        XCTAssertGreaterThan(improved.count, "a dog running".count)
    }

    func testSuggestReturnsNonEmptySuggestions() async throws {
        let provider = MockAIProvider()
        let suggestions = try await provider.suggest(category: .lighting, context: "a rainy street")
        XCTAssertFalse(suggestions.isEmpty)
    }
}
