import XCTest
@testable import AIVideoGenerator

final class EditorProjectTests: XCTestCase {
    private func makeClip(duration: TimeInterval, transition: TransitionType = .cut, transitionDuration: TimeInterval = 0.5) -> EditorClip {
        EditorClip(
            sourceURL: URL(string: "file:///tmp/clip.mov")!,
            sourceTrimEnd: duration,
            transition: transition,
            transitionDuration: transitionDuration
        )
    }

    func testTotalDurationWithoutTransitionsIsSumOfClips() {
        let project = EditorProject(name: "Test", clips: [makeClip(duration: 4), makeClip(duration: 6)])
        XCTAssertEqual(project.totalDuration, 10, accuracy: 0.001)
    }

    func testTotalDurationSubtractsTransitionOverlap() {
        let project = EditorProject(name: "Test", clips: [
            makeClip(duration: 4, transition: .crossDissolve, transitionDuration: 1),
            makeClip(duration: 6)
        ])
        XCTAssertEqual(project.totalDuration, 9, accuracy: 0.001)
    }

    func testClipStartTimesAccountForOverlap() {
        let project = EditorProject(name: "Test", clips: [
            makeClip(duration: 4, transition: .crossDissolve, transitionDuration: 1),
            makeClip(duration: 6, transition: .fadeToBlack, transitionDuration: 2),
            makeClip(duration: 5)
        ])
        let starts = project.clipStartTimes
        XCTAssertEqual(starts[0], 0, accuracy: 0.001)
        XCTAssertEqual(starts[1], 3, accuracy: 0.001)
        XCTAssertEqual(starts[2], 7, accuracy: 0.001)
    }

    func testSpeedAffectsTimelineDurationNotTrimmedDuration() {
        var clip = makeClip(duration: 10)
        clip.speed = 2
        XCTAssertEqual(clip.trimmedSourceDuration, 10, accuracy: 0.001)
        XCTAssertEqual(clip.timelineDuration, 5, accuracy: 0.001)
    }

    func testSplitClipProducesTwoNonOverlappingSourceRanges() {
        var project = EditorProject(name: "Test", clips: [makeClip(duration: 10)])
        let originalID = project.clips[0].id

        project.splitClip(id: originalID, atOffsetWithinClip: 4)

        XCTAssertEqual(project.clips.count, 2)
        XCTAssertEqual(project.clips[0].sourceTrimStart, 0, accuracy: 0.001)
        XCTAssertEqual(project.clips[0].sourceTrimEnd, 4, accuracy: 0.001)
        XCTAssertEqual(project.clips[0].transition, .cut)
        XCTAssertEqual(project.clips[1].sourceTrimStart, 4, accuracy: 0.001)
        XCTAssertEqual(project.clips[1].sourceTrimEnd, 10, accuracy: 0.001)
    }

    func testSplitClipIgnoresOutOfRangeOffset() {
        var project = EditorProject(name: "Test", clips: [makeClip(duration: 10)])
        let originalID = project.clips[0].id

        project.splitClip(id: originalID, atOffsetWithinClip: 20)

        XCTAssertEqual(project.clips.count, 1)
    }

    func testRemoveClipDropsItFromTheProject() {
        var project = EditorProject(name: "Test", clips: [makeClip(duration: 4), makeClip(duration: 6)])
        let secondID = project.clips[1].id

        project.removeClip(id: secondID)

        XCTAssertEqual(project.clips.count, 1)
        XCTAssertNil(project.clips.first { $0.id == secondID })
    }

    func testMoveClipReordersClips() {
        var project = EditorProject(name: "Test", clips: [makeClip(duration: 1), makeClip(duration: 2), makeClip(duration: 3)])
        let firstID = project.clips[0].id

        project.moveClip(id: firstID, toIndex: 2)

        XCTAssertEqual(project.clips.last?.id, firstID)
    }
}
