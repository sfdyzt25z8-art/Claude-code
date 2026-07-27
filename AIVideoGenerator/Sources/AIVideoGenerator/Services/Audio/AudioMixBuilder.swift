import AVFoundation

/// Adds every `AudioTrack` in an `EditorProject` (music, narration, ambient
/// loops) onto a composition as its own audio track, and returns an
/// `AVAudioMix` applying each track's volume and fade in/out — real per-track
/// mixing via `AVMutableAudioMixInputParameters`, not a placeholder.
enum AudioMixBuilder {
    @discardableResult
    static func apply(project: EditorProject, to composition: AVMutableComposition) async -> AVAudioMix? {
        guard !project.audioTracks.isEmpty else { return nil }

        var inputParameters: [AVMutableAudioMixInputParameters] = []

        for audioTrack in project.audioTracks where !audioTrack.isMuted {
            guard let compositionTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
                continue
            }

            let asset = AVURLAsset(url: audioTrack.sourceURL)
            guard let sourceTrack = try? await asset.loadTracks(withMediaType: .audio).first else { continue }

            let trimStart = CMTime(seconds: audioTrack.sourceTrimStart, preferredTimescale: 600)
            let duration = CMTime(seconds: audioTrack.duration, preferredTimescale: 600)
            let trimRange = CMTimeRange(start: trimStart, duration: duration)
            let insertTime = CMTime(seconds: audioTrack.timelineStart, preferredTimescale: 600)

            guard (try? compositionTrack.insertTimeRange(trimRange, of: sourceTrack, at: insertTime)) != nil else { continue }

            let parameters = AVMutableAudioMixInputParameters(track: compositionTrack)
            let volume = Float(audioTrack.volume)
            parameters.setVolume(volume, at: .zero)

            if audioTrack.fadeInDuration > 0 {
                let fadeInRange = CMTimeRange(start: insertTime, duration: CMTime(seconds: audioTrack.fadeInDuration, preferredTimescale: 600))
                parameters.setVolumeRamp(fromStartVolume: 0, toEndVolume: volume, timeRange: fadeInRange)
            }
            if audioTrack.fadeOutDuration > 0 {
                let fadeOutStart = insertTime + duration - CMTime(seconds: audioTrack.fadeOutDuration, preferredTimescale: 600)
                let fadeOutRange = CMTimeRange(start: fadeOutStart, duration: CMTime(seconds: audioTrack.fadeOutDuration, preferredTimescale: 600))
                parameters.setVolumeRamp(fromStartVolume: volume, toEndVolume: 0, timeRange: fadeOutRange)
            }

            inputParameters.append(parameters)
        }

        guard !inputParameters.isEmpty else { return nil }

        let mix = AVMutableAudioMix()
        mix.inputParameters = inputParameters
        return mix
    }
}
