import XCTest
@testable import AIVideoGenerator

final class SceneStitchingPlannerTests: XCTestCase {
    func testShortRequestProducesSingleScene() {
        let request = VideoGenerationRequest(prompt: "A calm lake at sunrise", duration: VideoDuration(seconds: 8))
        let scenes = SceneStitchingPlanner.plan(for: request, providerMaxSceneSeconds: 12)

        XCTAssertEqual(scenes.count, 1)
        XCTAssertEqual(scenes[0].duration, 8, accuracy: 0.001)
        XCTAssertEqual(scenes[0].prompt, request.prompt)
    }

    func testLongRequestIsSplitIntoMultipleScenes() {
        let request = VideoGenerationRequest(prompt: "An epic space battle", duration: VideoDuration(seconds: 40))
        let scenes = SceneStitchingPlanner.plan(for: request, providerMaxSceneSeconds: 12)

        // 40s / 12s per scene rounds up to 4 scenes.
        XCTAssertEqual(scenes.count, 4)

        let totalDuration = scenes.reduce(0) { $0 + $1.duration }
        XCTAssertEqual(totalDuration, 40, accuracy: 0.001)

        // Every scene after the first should reference continuity language.
        for scene in scenes.dropFirst() {
            XCTAssertTrue(scene.prompt.contains("continuation"))
        }
    }

    func testEveryLongFormSceneRespectsProviderCap() {
        let request = VideoGenerationRequest(duration: VideoDuration(seconds: VideoDuration.maximum))
        let scenes = SceneStitchingPlanner.plan(for: request, providerMaxSceneSeconds: 12)

        for scene in scenes {
            XCTAssertLessThanOrEqual(scene.duration, 12)
        }
        XCTAssertEqual(scenes.reduce(0) { $0 + $1.duration }, VideoDuration.maximum, accuracy: 0.001)
    }

    func testEstimatedCompletionScalesWithSceneCountAndResolution() {
        let lowRes = SceneStitchingPlanner.estimatedCompletion(sceneCount: 4, resolution: .r720p)
        let highRes = SceneStitchingPlanner.estimatedCompletion(sceneCount: 4, resolution: .r4K)

        XCTAssertGreaterThan(highRes, lowRes)
    }
}
