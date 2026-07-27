import XCTest
@testable import AIVideoGenerator

@MainActor
final class VideoGeneratorViewModelTests: XCTestCase {
    private func makeViewModel() async -> VideoGeneratorViewModel {
        let registry = ProviderRegistry()
        registry.register(videoProvider: MockAIVideoProvider())
        let store = LocalProjectStore(directory: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
        let manager = GenerationQueueManager(providerRegistry: registry, projectStore: store)
        return VideoGeneratorViewModel(
            queueManager: manager,
            promptAssistant: MockPromptAssistant(),
            availableProviders: [MockAIVideoProvider()]
        )
    }

    func testCannotSubmitWithEmptyPrompt() async {
        let viewModel = await makeViewModel()
        viewModel.prompt = ""
        XCTAssertFalse(viewModel.canSubmit)
    }

    func testCanSubmitWithValidPrompt() async {
        let viewModel = await makeViewModel()
        viewModel.prompt = "A dramatic aerial shot of a snowy mountain range"
        XCTAssertTrue(viewModel.canSubmit)
    }

    func testWillRequireSceneStitchingForLongDuration() async {
        let viewModel = await makeViewModel()
        viewModel.prompt = "A dramatic aerial shot of a snowy mountain range"
        viewModel.durationSeconds = 60
        XCTAssertTrue(viewModel.willRequireSceneStitching)
    }

    func testDoesNotRequireSceneStitchingForShortDuration() async {
        let viewModel = await makeViewModel()
        viewModel.prompt = "A dramatic aerial shot of a snowy mountain range"
        viewModel.durationSeconds = 5
        XCTAssertFalse(viewModel.willRequireSceneStitching)
    }

    func testApplyTemplateSetsPromptAndStyle() async {
        let viewModel = await makeViewModel()
        let template = PromptTemplate.defaults[0]
        viewModel.applyTemplate(template)
        XCTAssertEqual(viewModel.prompt, template.prompt)
        XCTAssertEqual(viewModel.style, template.style)
    }

    func testSubmitProducesJob() async {
        let viewModel = await makeViewModel()
        viewModel.prompt = "A dramatic aerial shot of a snowy mountain range"
        let job = await viewModel.submit()
        XCTAssertNotNil(job)
        XCTAssertEqual(viewModel.submittedJob?.id, job?.id)
    }
}
