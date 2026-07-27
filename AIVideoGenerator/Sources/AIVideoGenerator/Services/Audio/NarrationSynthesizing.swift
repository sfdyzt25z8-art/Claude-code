import AVFoundation

/// Renders text to a real narration audio file. Unlike the music/ambient
/// catalogs (which need bundled or downloaded audio this build doesn't
/// ship), narration is fully implemented on-device via `AVSpeechSynthesizer`
/// — no external asset required.
protocol NarrationSynthesizing: Sendable {
    func synthesize(text: String, voiceIdentifier: String?) async throws -> URL
}

struct SpeechSynthesisNarrator: NarrationSynthesizing {
    func synthesize(text: String, voiceIdentifier: String? = nil) async throws -> URL {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw AppError.validation("Enter some narration text first.")
        }

        let utterance = AVSpeechUtterance(string: text)
        if let voiceIdentifier, let voice = AVSpeechSynthesisVoice(identifier: voiceIdentifier) {
            utterance.voice = voice
        }

        let outputURL = FileManager.default.temporaryDirectory.appendingPathComponent("narration-\(UUID().uuidString).caf")
        let synthesizer = AVSpeechSynthesizer()

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            var didResume = false
            var audioFile: AVAudioFile?

            synthesizer.write(utterance) { buffer in
                guard !didResume else { return }
                guard let pcmBuffer = buffer as? AVAudioPCMBuffer else { return }

                // Apple's documented signal that synthesis has finished: an empty final buffer.
                guard pcmBuffer.frameLength > 0 else {
                    didResume = true
                    continuation.resume(returning: ())
                    return
                }

                do {
                    if audioFile == nil {
                        audioFile = try AVAudioFile(forWriting: outputURL, settings: pcmBuffer.format.settings)
                    }
                    try audioFile?.write(from: pcmBuffer)
                } catch {
                    didResume = true
                    continuation.resume(throwing: error)
                }
            }
        }

        return outputURL
    }
}

/// Deterministic offline stand-in for previews/tests.
struct MockNarrationSynthesizer: NarrationSynthesizing {
    func synthesize(text: String, voiceIdentifier: String?) async throws -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("mock-narration.caf")
    }
}
