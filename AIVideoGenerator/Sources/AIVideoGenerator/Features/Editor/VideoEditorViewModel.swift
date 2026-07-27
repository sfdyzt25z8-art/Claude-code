import AVFoundation
import Observation

/// Drives the Video Editor: owns the `EditorProject` being edited, rebuilds
/// the real `AVPlayer` preview (debounced) whenever the project changes, and
/// exposes actions for every tool (trim, split, crop, rotate, speed,
/// transitions, titles, captions, color grade, effects, PiP, export).
@MainActor
@Observable
final class VideoEditorViewModel {
    var project: EditorProject
    private(set) var player: AVPlayer?
    private(set) var isRebuildingPreview = false
    private(set) var previewError: AppError?

    var selectedClipID: EditorClip.ID?
    var isExporting = false
    var exportProgress: Double = 0
    var lastExportedURL: URL?
    var lastError: AppError?

    private(set) var isSynthesizingNarration = false

    private let exporter: VideoExporting
    private let captionGenerator: CaptionGenerating
    private let narrator: NarrationSynthesizing
    private var rebuildTask: Task<Void, Never>?

    init(
        project: EditorProject,
        exporter: VideoExporting = AVFoundationVideoExporter(),
        captionGenerator: CaptionGenerating = SpeechCaptionGenerator(),
        narrator: NarrationSynthesizing = SpeechSynthesisNarrator()
    ) {
        self.project = project
        self.exporter = exporter
        self.captionGenerator = captionGenerator
        self.narrator = narrator
        self.selectedClipID = project.clips.first?.id
        scheduleRebuild()
    }

    var selectedClip: EditorClip? {
        get { project.clips.first { $0.id == selectedClipID } }
        set {
            guard let newValue, let index = project.clips.firstIndex(where: { $0.id == newValue.id }) else { return }
            project.clips[index] = newValue
            scheduleRebuild()
        }
    }

    var selectedClipIndex: Int? {
        project.clips.firstIndex { $0.id == selectedClipID }
    }

    // MARK: - Timeline operations

    func selectClip(_ id: EditorClip.ID) {
        selectedClipID = id
    }

    func splitSelectedClip(atOffsetWithinClip offset: TimeInterval) {
        guard let selectedClipID else { return }
        project.splitClip(id: selectedClipID, atOffsetWithinClip: offset)
        scheduleRebuild()
    }

    func deleteSelectedClip() {
        guard let selectedClipID else { return }
        project.removeClip(id: selectedClipID)
        self.selectedClipID = project.clips.first?.id
        scheduleRebuild()
    }

    func moveClip(id: EditorClip.ID, toIndex index: Int) {
        project.moveClip(id: id, toIndex: index)
        scheduleRebuild()
    }

    func appendClip(sourceURL: URL, duration: TimeInterval) {
        let clip = EditorClip(sourceURL: sourceURL, sourceTrimEnd: duration)
        project.clips.append(clip)
        selectedClipID = clip.id
        scheduleRebuild()
    }

    // MARK: - Titles & captions

    func addTitle(_ title: TitleOverlay) {
        project.titles.append(title)
        scheduleRebuild()
    }

    func removeTitle(id: TitleOverlay.ID) {
        project.titles.removeAll { $0.id == id }
        scheduleRebuild()
    }

    func addCaption(_ caption: CaptionCue) {
        project.captions.append(caption)
        scheduleRebuild()
    }

    func removeCaption(id: CaptionCue.ID) {
        project.captions.removeAll { $0.id == id }
        scheduleRebuild()
    }

    func generateAutomaticCaptions(languageCode: String = "en-US") async {
        guard let firstClip = project.clips.first else { return }
        do {
            let cues = try await captionGenerator.generateCaptions(from: firstClip.sourceURL, languageCode: languageCode)
            project.captions.append(contentsOf: cues)
            scheduleRebuild()
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    // MARK: - Sound

    func addAudioTrack(_ track: AudioTrack) {
        project.audioTracks.append(track)
        scheduleRebuild()
    }

    func removeAudioTrack(id: AudioTrack.ID) {
        project.audioTracks.removeAll { $0.id == id }
        scheduleRebuild()
    }

    func updateAudioTrack(_ track: AudioTrack) {
        guard let index = project.audioTracks.firstIndex(where: { $0.id == track.id }) else { return }
        project.audioTracks[index] = track
        scheduleRebuild()
    }

    func synthesizeNarration(text: String, voiceIdentifier: String? = nil) async {
        isSynthesizingNarration = true
        defer { isSynthesizingNarration = false }
        do {
            let url = try await narrator.synthesize(text: text, voiceIdentifier: voiceIdentifier)
            let asset = AVURLAsset(url: url)
            let duration = try await asset.load(.duration)
            let track = AudioTrack(kind: .narration, sourceURL: url, displayName: String(text.prefix(40)), duration: CMTimeGetSeconds(duration))
            addAudioTrack(track)
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    // MARK: - Picture-in-picture

    func setPictureInPicture(_ layer: PictureInPictureLayer?) {
        project.pictureInPicture = layer
        scheduleRebuild()
    }

    // MARK: - Export

    func export(options: ExportOptions) async {
        isExporting = true
        exportProgress = 0
        defer { isExporting = false }
        do {
            let url = try await exporter.export(project: project, options: options) { [weak self] progress in
                Task { @MainActor in
                    self?.exportProgress = progress
                }
            }
            lastExportedURL = url
            exportProgress = 1
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    func saveLastExportToPhotos() async {
        guard let url = lastExportedURL else { return }
        do {
            try await PhotoLibrarySaving.saveVideo(at: url)
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    // MARK: - Preview rebuilding

    private func scheduleRebuild() {
        rebuildTask?.cancel()
        rebuildTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 350_000_000)
            guard !Task.isCancelled else { return }
            await self?.rebuildPreview()
        }
    }

    private func rebuildPreview() async {
        guard !project.clips.isEmpty else {
            player = nil
            return
        }
        isRebuildingPreview = true
        defer { isRebuildingPreview = false }

        do {
            let built = try await VideoCompositionBuilder.build(project: project)
            let audioMix = await AudioMixBuilder.apply(project: project, to: built.composition)
            let playerItem = AVPlayerItem(asset: built.composition)
            playerItem.videoComposition = built.videoComposition
            playerItem.audioMix = audioMix

            if let existingPlayer = player {
                existingPlayer.replaceCurrentItem(with: playerItem)
            } else {
                player = AVPlayer(playerItem: playerItem)
            }
            previewError = nil
        } catch {
            previewError = error as? AppError ?? .unknown
        }
    }
}
