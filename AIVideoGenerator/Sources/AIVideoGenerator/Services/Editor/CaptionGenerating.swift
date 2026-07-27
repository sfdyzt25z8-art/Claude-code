import Foundation
import Speech

/// Produces `CaptionCue`s from the audio in a media file. The "Automatic
/// captions" feature from the spec is implemented for real via `Speech`
/// (on-device/server speech-to-text, whichever `SFSpeechRecognizer` chooses),
/// not simulated — see `SpeechCaptionGenerator`.
protocol CaptionGenerating: Sendable {
    func generateCaptions(from mediaURL: URL, languageCode: String) async throws -> [CaptionCue]
}

/// Real implementation backed by `SFSpeechRecognizer`. Requests speech
/// recognition authorization on first use, transcribes the file at `mediaURL`
/// (a video or audio file — `SFSpeechURLRecognitionRequest` reads the audio
/// track directly), and groups the recognizer's word-level timing into
/// readable multi-word cues.
struct SpeechCaptionGenerator: CaptionGenerating {
    /// Roughly how many words each caption cue should contain before starting a new one.
    var wordsPerCue: Int = 7

    func generateCaptions(from mediaURL: URL, languageCode: String) async throws -> [CaptionCue] {
        try await requestAuthorizationIfNeeded()

        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: languageCode)), recognizer.isAvailable else {
            throw AppError.validation("Speech recognition isn't available for \(languageCode) on this device.")
        }

        let request = SFSpeechURLRecognitionRequest(url: mediaURL)
        request.shouldReportPartialResults = false

        let segments = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[SFTranscriptionSegment], Error>) in
            var didResume = false
            recognizer.recognitionTask(with: request) { result, error in
                guard !didResume else { return }
                if let error {
                    didResume = true
                    continuation.resume(throwing: error)
                    return
                }
                guard let result, result.isFinal else { return }
                didResume = true
                continuation.resume(returning: result.bestTranscription.segments)
            }
        }

        return Self.groupIntoCues(segments: segments, wordsPerCue: wordsPerCue, languageCode: languageCode)
    }

    private func requestAuthorizationIfNeeded() async throws {
        let status = await withCheckedContinuation { (continuation: CheckedContinuation<SFSpeechRecognizerAuthorizationStatus, Never>) in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
        guard status == .authorized else {
            throw AppError.authenticationFailed("Speech recognition access was denied. Enable it in Settings to generate automatic captions.")
        }
    }

    private static func groupIntoCues(segments: [SFTranscriptionSegment], wordsPerCue: Int, languageCode: String) -> [CaptionCue] {
        guard !segments.isEmpty else { return [] }

        var cues: [CaptionCue] = []
        var chunk: [SFTranscriptionSegment] = []

        func flush() {
            guard let first = chunk.first, let last = chunk.last else { return }
            let text = chunk.map(\.substring).joined(separator: " ")
            let start = first.timestamp
            let end = last.timestamp + last.duration
            cues.append(CaptionCue(text: text, timelineStart: start, timelineEnd: end, languageCode: languageCode))
            chunk.removeAll()
        }

        for segment in segments {
            chunk.append(segment)
            if chunk.count >= wordsPerCue {
                flush()
            }
        }
        flush()

        return cues
    }
}

/// Deterministic offline generator for previews/tests: splits placeholder text
/// evenly across the given duration without touching the Speech framework.
struct MockCaptionGenerator: CaptionGenerating {
    func generateCaptions(from mediaURL: URL, languageCode: String) async throws -> [CaptionCue] {
        let placeholderLines = [
            "This is an automatically generated caption.",
            "Review and edit the timing before exporting.",
            "Automatic captions are a starting point, not final copy."
        ]
        return placeholderLines.enumerated().map { index, line in
            CaptionCue(text: line, timelineStart: TimeInterval(index) * 3, timelineEnd: TimeInterval(index) * 3 + 2.6, languageCode: languageCode)
        }
    }
}
