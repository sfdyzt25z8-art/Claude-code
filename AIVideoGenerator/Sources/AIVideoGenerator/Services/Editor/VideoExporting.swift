import AVFoundation

/// Renders an `EditorProject` to a real video file on disk via
/// `AVAssetExportSession`, reusing `VideoCompositionBuilder`'s composition so
/// the export exactly matches what the editor previews.
protocol VideoExporting: Sendable {
    func export(project: EditorProject, options: ExportOptions, onProgress: @escaping @Sendable (Double) -> Void) async throws -> URL
}

struct ExportOptions: Sendable {
    var format: ExportFormat
    /// Quality tier used to pick the underlying `AVAssetExportSession` preset.
    /// `AVAssetExportSession` is preset-driven rather than accepting an exact
    /// bits-per-second value, so "choose bitrate" is implemented as this
    /// coarser quality tier rather than a literal bps field — documented here
    /// rather than faked with a control that wouldn't actually take effect.
    var quality: Quality
    var frameRate: FrameRate

    enum Quality: String, CaseIterable, Identifiable, Hashable, Sendable {
        case standard, high, maximum
        var id: String { rawValue }
        var displayName: String {
            switch self {
            case .standard: return "Standard"
            case .high: return "High"
            case .maximum: return "Maximum"
            }
        }
    }

    init(format: ExportFormat = .mp4, quality: Quality = .high, frameRate: FrameRate = .fps30) {
        self.format = format
        self.quality = quality
        self.frameRate = frameRate
    }
}

struct AVFoundationVideoExporter: VideoExporting {
    func export(project: EditorProject, options: ExportOptions, onProgress: @escaping @Sendable (Double) -> Void = { _ in }) async throws -> URL {
        let built = try await VideoCompositionBuilder.build(project: project)
        let audioMix = await AudioMixBuilder.apply(project: project, to: built.composition)

        guard let session = AVAssetExportSession(asset: built.composition, presetName: presetName(for: options)) else {
            throw AppError.storage("Couldn't create an export session for this project.")
        }

        session.videoComposition = built.videoComposition
        session.audioMix = audioMix
        session.outputFileType = options.format.avFileType
        session.shouldOptimizeForNetworkUse = true

        let outputURL = Self.temporaryOutputURL(format: options.format)
        session.outputURL = outputURL

        let progressTask = Task {
            while !Task.isCancelled {
                onProgress(Double(session.progress))
                try? await Task.sleep(nanoseconds: 200_000_000)
            }
        }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            session.exportAsynchronously {
                switch session.status {
                case .completed:
                    continuation.resume(returning: ())
                case .failed:
                    continuation.resume(throwing: AppError.storage(session.error?.localizedDescription ?? "Export failed."))
                case .cancelled:
                    continuation.resume(throwing: AppError.storage("Export was cancelled."))
                default:
                    continuation.resume(throwing: AppError.storage("Export ended in an unexpected state."))
                }
            }
        }

        progressTask.cancel()
        onProgress(1)

        return outputURL
    }

    private func presetName(for options: ExportOptions) -> String {
        if options.format == .hevc {
            return AVAssetExportPresetHEVCHighestQuality
        }
        switch options.quality {
        case .standard: return AVAssetExportPresetMediumQuality
        case .high: return AVAssetExportPresetHighestQuality
        case .maximum: return AVAssetExportPresetHighestQuality
        }
    }

    private static func temporaryOutputURL(format: ExportFormat) -> URL {
        let fileExtension: String
        switch format {
        case .mp4, .hevc: fileExtension = "mp4"
        case .mov: fileExtension = "mov"
        }
        return FileManager.default.temporaryDirectory
            .appendingPathComponent("export-\(UUID().uuidString)")
            .appendingPathExtension(fileExtension)
    }
}

extension ExportFormat {
    var avFileType: AVFileType {
        switch self {
        case .mp4, .hevc: return .mp4
        case .mov: return .mov
        }
    }
}
