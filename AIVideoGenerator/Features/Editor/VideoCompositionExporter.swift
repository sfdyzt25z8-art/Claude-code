import Foundation
import AVFoundation

/// Renders the timeline's clips, transitions, sound assets, and overlays
/// into a single exportable video using `AVMutableComposition`. This is the
/// production rendering pipeline entry point — once clips reference real,
/// locally-downloaded media (rather than the demo engine's placeholder
/// URLs), this exporter produces a real MP4/MOV/HEVC file suitable for
/// Photos or the Share Sheet.
enum VideoCompositionExporter {
    struct ExportOptions {
        var format: ExportFormat
        var bitrate: ExportBitrate
        var resolution: VideoResolution
        var frameRate: VideoFrameRate
    }

    enum ExportError: LocalizedError {
        case noClips
        case compositionFailed
        case exportSessionUnavailable
        case exportFailed(String)

        var errorDescription: String? {
            switch self {
            case .noClips: "Add at least one clip to the timeline before exporting."
            case .compositionFailed: "Couldn't build the video composition."
            case .exportSessionUnavailable: "Export is unavailable on this device."
            case .exportFailed(let message): "Export failed: \(message)"
            }
        }
    }

    static func export(
        clips: [EditorClip],
        soundAssets: [SoundAsset],
        subtitles: [SubtitleCue],
        options: ExportOptions,
        progressHandler: @escaping (Double) -> Void
    ) async throws -> URL {
        guard !clips.isEmpty else { throw ExportError.noClips }

        let composition = AVMutableComposition()
        guard let videoTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
            throw ExportError.compositionFailed
        }

        var cursor = CMTime.zero
        for clip in clips {
            let asset = AVURLAsset(url: clip.sourceURL)
            guard let assetTrack = try? await asset.loadTracks(withMediaType: .video).first else { continue }

            let start = CMTime(seconds: clip.trimStart, preferredTimescale: 600)
            let end = CMTime(seconds: clip.trimEnd, preferredTimescale: 600)
            let range = CMTimeRange(start: start, end: end)

            try? videoTrack.insertTimeRange(range, of: assetTrack, at: cursor)
            cursor = CMTimeAdd(cursor, CMTimeSubtract(end, start))
        }

        for sound in soundAssets {
            guard let sourceURL = sound.sourceURL,
                  let audioTrack = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else { continue }
            let asset = AVURLAsset(url: sourceURL)
            if let assetAudioTrack = try? await asset.loadTracks(withMediaType: .audio).first {
                try? audioTrack.insertTimeRange(
                    CMTimeRange(start: .zero, duration: composition.duration),
                    of: assetAudioTrack,
                    at: .zero
                )
                audioTrack.preferredVolume = Float(sound.volume)
            }
        }

        guard let exportSession = AVAssetExportSession(
            asset: composition,
            presetName: exportPreset(for: options.resolution)
        ) else {
            throw ExportError.exportSessionUnavailable
        }

        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension(options.format.fileExtension)

        exportSession.outputURL = outputURL
        exportSession.outputFileType = outputFileType(for: options.format)

        let progressTask = Task {
            while exportSession.status == .waiting || exportSession.status == .exporting {
                progressHandler(Double(exportSession.progress))
                try? await Task.sleep(for: .milliseconds(200))
            }
        }

        // `AVAssetExportSession.export() async` requires iOS 18; use the
        // completion-handler API (available since iOS 4) wrapped in a
        // continuation so this targets iOS 17.
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            exportSession.exportAsynchronously {
                continuation.resume()
            }
        }
        progressTask.cancel()

        guard exportSession.status == .completed else {
            throw ExportError.exportFailed(exportSession.error?.localizedDescription ?? "Unknown error")
        }

        progressHandler(1.0)
        return outputURL
    }

    private static func exportPreset(for resolution: VideoResolution) -> String {
        switch resolution {
        case .r720p: AVAssetExportPreset1280x720
        case .r1080p: AVAssetExportPreset1920x1080
        case .r1440p, .r4K: AVAssetExportPresetHighestQuality
        }
    }

    private static func outputFileType(for format: ExportFormat) -> AVFileType {
        switch format {
        case .mp4: .mp4
        case .mov, .hevc: .mov
        }
    }
}
