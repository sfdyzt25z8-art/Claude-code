import XCTest
@testable import AIVideoGenerator

final class VideoDurationTests: XCTestCase {
    func testClampsBelowMinimum() {
        let duration = VideoDuration(seconds: 0)
        XCTAssertEqual(duration.seconds, VideoDuration.minimum)
    }

    func testClampsAboveMaximum() {
        let duration = VideoDuration(seconds: 999_999)
        XCTAssertEqual(duration.seconds, VideoDuration.maximum)
    }

    func testFormattedSecondsOnly() {
        XCTAssertEqual(VideoDuration(seconds: 9).formatted, "9s")
    }

    func testFormattedMinutesAndSeconds() {
        XCTAssertEqual(VideoDuration(seconds: 95).formatted, "1m 35s")
    }

    func testFormattedHoursAndMinutes() {
        XCTAssertEqual(VideoDuration(seconds: 5400).formatted, "1h 30m")
    }

    func testMaximumDurationIsNinetyMinutes() {
        XCTAssertEqual(VideoDuration.maximum, 90 * 60)
    }
}
