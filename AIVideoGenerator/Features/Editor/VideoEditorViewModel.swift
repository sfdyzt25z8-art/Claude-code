import Foundation
import CoreGraphics

@MainActor
final class VideoEditorViewModel: ObservableObject {
    @Published var clips: [EditorClip] = []
    @Published var selectedClipID: EditorClip.ID?
    @Published var titles: [TitleOverlay] = []
    @Published var subtitles: [SubtitleCue] = []
    @Published var soundAssets: [SoundAsset] = []
    @Published var appliedEffects: Set<VisualEffect> = []
    @Published var colorGradingIntensity: Double = 0
    @Published var playheadTime: TimeInterval = 0

    @Published var exportFormat: ExportFormat = .mp4
    @Published var exportBitrate: ExportBitrate = .high
    @Published var exportResolution: VideoResolution = .r1080p
    @Published var exportFrameRate: VideoFrameRate = .fps30

    @Published private(set) var isExporting = false
    @Published private(set) var exportProgress: Double = 0
    @Published private(set) var exportedFileURL: URL?
    @Published var toast: Toast?

    let project: VideoProject?
    private let projectStore: ProjectStoreProtocol?

    init(project: VideoProject?, projectStore: ProjectStoreProtocol? = nil) {
        self.project = project
        self.projectStore = projectStore

        if let mediaURL = project?.mediaURL {
            clips = [EditorClip(sourceURL: mediaURL, trimEnd: project?.durationSeconds ?? 10)]
        }
        subtitles = project?.subtitles ?? []
        soundAssets = project?.soundAssets ?? []
        appliedEffects = Set(project?.appliedEffects ?? [])
    }

    var totalDuration: TimeInterval {
        clips.reduce(0) { $0 + $1.trimmedDuration }
    }

    var selectedClip: EditorClip? {
        clips.first { $0.id == selectedClipID }
    }

    // MARK: - Timeline editing

    func selectClip(_ id: EditorClip.ID) {
        selectedClipID = id
    }

    func trim(clipID: EditorClip.ID, start: TimeInterval, end: TimeInterval) {
        guard let index = clips.firstIndex(where: { $0.id == clipID }) else { return }
        clips[index].trimStart = min(start, end)
        clips[index].trimEnd = max(start, end)
    }

    /// Splits the clip under the playhead into two independent clips.
    func split(clipID: EditorClip.ID, at time: TimeInterval) {
        guard let index = clips.firstIndex(where: { $0.id == clipID }) else { return }
        let clip = clips[index]
        guard time > clip.trimStart, time < clip.trimEnd else { return }

        let first = EditorClip(sourceURL: clip.sourceURL, trimStart: clip.trimStart, trimEnd: time, speed: clip.speed, rotationDegrees: clip.rotationDegrees, cropRect: clip.cropRect)
        let second = EditorClip(sourceURL: clip.sourceURL, trimStart: time, trimEnd: clip.trimEnd, speed: clip.speed, rotationDegrees: clip.rotationDegrees, cropRect: clip.cropRect, transitionToNext: clip.transitionToNext)

        clips.replaceSubrange(index...index, with: [first, second])
    }

    func merge(clipID: EditorClip.ID, withNext: Bool) {
        guard let index = clips.firstIndex(where: { $0.id == clipID }) else { return }
        let neighborIndex = withNext ? index + 1 : index - 1
        guard clips.indices.contains(neighborIndex) else { return }

        let a = withNext ? clips[index] : clips[neighborIndex]
        let b = withNext ? clips[neighborIndex] : clips[index]
        guard a.sourceURL == b.sourceURL else {
            toast = Toast(message: "Only clips from the same source can be merged.", style: .error)
            return
        }

        let merged = EditorClip(sourceURL: a.sourceURL, trimStart: a.trimStart, trimEnd: b.trimEnd, speed: a.speed, rotationDegrees: a.rotationDegrees)
        let lowerIndex = min(index, neighborIndex)
        clips.replaceSubrange(lowerIndex...(lowerIndex + 1), with: [merged])
    }

    func removeClip(_ id: EditorClip.ID) {
        clips.removeAll { $0.id == id }
    }

    func setSpeed(_ speed: Double, forClip id: EditorClip.ID) {
        guard let index = clips.firstIndex(where: { $0.id == id }) else { return }
        clips[index].speed = speed
    }

    func setRotation(_ degrees: Double, forClip id: EditorClip.ID) {
        guard let index = clips.firstIndex(where: { $0.id == id }) else { return }
        clips[index].rotationDegrees = degrees
    }

    func setCrop(_ rect: CGRect?, forClip id: EditorClip.ID) {
        guard let index = clips.firstIndex(where: { $0.id == id }) else { return }
        clips[index].cropRect = rect
    }

    func setTransition(_ transition: EditorClip.Transition, forClip id: EditorClip.ID) {
        guard let index = clips.firstIndex(where: { $0.id == id }) else { return }
        clips[index].transitionToNext = transition
    }

    // MARK: - Effects, sound, subtitles

    func toggleEffect(_ effect: VisualEffect) {
        if appliedEffects.contains(effect) {
            appliedEffects.remove(effect)
        } else {
            appliedEffects.insert(effect)
        }
    }

    func addAmbientSound(_ sound: AmbientSound) {
        soundAssets.append(SoundAsset(kind: .ambient, name: sound.displayName))
    }

    func removeSound(_ id: SoundAsset.ID) {
        soundAssets.removeAll { $0.id == id }
    }

    func updateVolume(_ volume: Double, forSound id: SoundAsset.ID) {
        guard let index = soundAssets.firstIndex(where: { $0.id == id }) else { return }
        soundAssets[index].volume = volume
    }

    func addSubtitleCue(text: String, start: TimeInterval, end: TimeInterval) {
        subtitles.append(SubtitleCue(startTime: start, endTime: end, text: text))
        subtitles.sort { $0.startTime < $1.startTime }
    }

    func removeSubtitleCue(_ id: SubtitleCue.ID) {
        subtitles.removeAll { $0.id == id }
    }

    func addTitle(text: String) {
        let start = playheadTime
        titles.append(TitleOverlay(text: text, startTime: start, endTime: start + 3))
    }

    // MARK: - Export

    func export() async {
        isExporting = true
        exportProgress = 0
        defer { isExporting = false }

        do {
            let options = VideoCompositionExporter.ExportOptions(
                format: exportFormat, bitrate: exportBitrate, resolution: exportResolution, frameRate: exportFrameRate
            )
            let url = try await VideoCompositionExporter.export(
                clips: clips, soundAssets: soundAssets, subtitles: subtitles, options: options
            ) { [weak self] progress in
                Task { @MainActor in self?.exportProgress = progress }
            }
            exportedFileURL = url
            toast = Toast(message: "Export complete.", style: .success)
        } catch {
            toast = Toast(message: error.localizedDescription, style: .error)
        }
    }

    func saveProjectSnapshot() async {
        guard var project, let projectStore else { return }
        project.subtitles = subtitles
        project.soundAssets = soundAssets
        project.appliedEffects = Array(appliedEffects)
        project.versionHistory.append(ProjectVersion(note: "Edited in Video Editor"))
        try? await projectStore.save(project)
    }
}
