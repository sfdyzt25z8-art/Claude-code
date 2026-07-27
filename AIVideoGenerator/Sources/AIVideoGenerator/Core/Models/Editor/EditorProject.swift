import Foundation
import CoreGraphics

/// An in-memory editing session for a single video: an ordered sequence of
/// clips on the main track, an optional picture-in-picture layer, title and
/// caption overlays, and audio tracks. `VideoCompositionBuilder` turns this
/// into a real `AVMutableComposition`/`AVMutableVideoComposition` for preview
/// playback and export; nothing in this file touches AVFoundation so the
/// model stays simple, testable, and Codable (durations are plain
/// `TimeInterval`s — CoreMedia's `CMTime` isn't `Codable`).
struct EditorProject: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var name: String
    var clips: [EditorClip]
    var pictureInPicture: PictureInPictureLayer?
    var titles: [TitleOverlay]
    var captions: [CaptionCue]
    var audioTracks: [AudioTrack]
    var resolution: VideoResolution
    var frameRate: FrameRate
    var aspectRatio: VideoAspectRatio

    init(
        id: UUID = UUID(),
        name: String,
        clips: [EditorClip],
        pictureInPicture: PictureInPictureLayer? = nil,
        titles: [TitleOverlay] = [],
        captions: [CaptionCue] = [],
        audioTracks: [AudioTrack] = [],
        resolution: VideoResolution = .p1080,
        frameRate: FrameRate = .fps30,
        aspectRatio: VideoAspectRatio = .widescreen
    ) {
        self.id = id
        self.name = name
        self.clips = clips
        self.pictureInPicture = pictureInPicture
        self.titles = titles
        self.captions = captions
        self.audioTracks = audioTracks
        self.resolution = resolution
        self.frameRate = frameRate
        self.aspectRatio = aspectRatio
    }

    /// Total timeline duration: the sum of every clip's trimmed, speed-adjusted
    /// duration, minus the overlap consumed by cross-dissolve/fade transitions
    /// (a transition's `duration` is time shared between two adjacent clips,
    /// not additional time).
    var totalDuration: TimeInterval {
        guard !clips.isEmpty else { return 0 }
        let clipDurations = clips.reduce(0) { $0 + $1.timelineDuration }
        let transitionOverlap = clips.dropLast().reduce(0) { partial, clip in
            partial + (clip.transition.isNone ? 0 : clip.transitionDuration)
        }
        return max(clipDurations - transitionOverlap, 0)
    }

    /// The timeline start time of each clip, accounting for transition overlap
    /// with its predecessor. Index-aligned with `clips`.
    var clipStartTimes: [TimeInterval] {
        var starts: [TimeInterval] = []
        var cursor: TimeInterval = 0
        for (index, clip) in clips.enumerated() {
            starts.append(cursor)
            cursor += clip.timelineDuration
            if index < clips.count - 1, !clip.transition.isNone {
                cursor -= clip.transitionDuration
            }
        }
        return starts
    }

    mutating func splitClip(id clipID: EditorClip.ID, atOffsetWithinClip offset: TimeInterval) {
        guard let index = clips.firstIndex(where: { $0.id == clipID }) else { return }
        let original = clips[index]
        guard offset > 0, offset < original.trimmedSourceDuration else { return }

        var first = original
        first.sourceTrimEnd = original.sourceTrimStart + offset
        first.transition = .cut
        first.transitionDuration = 0

        var second = original
        second.id = UUID()
        second.sourceTrimStart = original.sourceTrimStart + offset

        clips.replaceSubrange(index...index, with: [first, second])
    }

    mutating func removeClip(id clipID: EditorClip.ID) {
        clips.removeAll { $0.id == clipID }
    }

    mutating func moveClip(id clipID: EditorClip.ID, toIndex destination: Int) {
        guard let sourceIndex = clips.firstIndex(where: { $0.id == clipID }) else { return }
        let clip = clips.remove(at: sourceIndex)
        clips.insert(clip, at: min(max(destination, 0), clips.count))
    }
}

/// One clip on the editor's main track: a trimmed region of a source asset
/// with speed, rotation, crop, color/effect treatment, and the transition
/// used to enter the *next* clip.
struct EditorClip: Identifiable, Codable, Equatable, Sendable {
    var id: UUID
    var sourceURL: URL
    /// Trim range within the source asset, in source-time seconds (untouched by `speed`).
    var sourceTrimStart: TimeInterval
    var sourceTrimEnd: TimeInterval
    /// Playback rate multiplier (0.25x–4x). Applied via `AVMutableCompositionTrack.scaleTimeRange`.
    var speed: Double
    /// Clockwise rotation in degrees; typically a multiple of 90 but any value is supported.
    var rotationDegrees: Double
    /// Normalized (0...1) crop rectangle within the source frame; `nil` means uncropped.
    var cropRect: CGRect?
    var colorGrade: ColorGradeSettings
    var effect: VideoEffectType?
    var vfxOverlay: VFXOverlayType?
    var zoomKeyframe: ZoomKeyframe?
    /// Transition used when moving from this clip into the next one; ignored on the last clip.
    var transition: TransitionType
    var transitionDuration: TimeInterval

    init(
        id: UUID = UUID(),
        sourceURL: URL,
        sourceTrimStart: TimeInterval = 0,
        sourceTrimEnd: TimeInterval,
        speed: Double = 1,
        rotationDegrees: Double = 0,
        cropRect: CGRect? = nil,
        colorGrade: ColorGradeSettings = .neutral,
        effect: VideoEffectType? = nil,
        vfxOverlay: VFXOverlayType? = nil,
        zoomKeyframe: ZoomKeyframe? = nil,
        transition: TransitionType = .cut,
        transitionDuration: TimeInterval = 0.5
    ) {
        self.id = id
        self.sourceURL = sourceURL
        self.sourceTrimStart = sourceTrimStart
        self.sourceTrimEnd = sourceTrimEnd
        self.speed = speed
        self.rotationDegrees = rotationDegrees
        self.cropRect = cropRect
        self.colorGrade = colorGrade
        self.effect = effect
        self.vfxOverlay = vfxOverlay
        self.zoomKeyframe = zoomKeyframe
        self.transition = transition
        self.transitionDuration = transitionDuration
    }

    var trimmedSourceDuration: TimeInterval {
        max(sourceTrimEnd - sourceTrimStart, 0)
    }

    /// Duration this clip occupies on the timeline after applying `speed`.
    var timelineDuration: TimeInterval {
        guard speed > 0 else { return trimmedSourceDuration }
        return trimmedSourceDuration / speed
    }
}

/// A secondary clip composited as picture-in-picture over the main track for
/// a given portion of the timeline.
struct PictureInPictureLayer: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var clip: EditorClip
    /// Where the PiP window starts on the main timeline, in seconds.
    var timelineStart: TimeInterval
    /// Normalized (0...1) frame within the full output frame.
    var frame: CGRect
    var cornerRadius: CGFloat

    init(
        id: UUID = UUID(),
        clip: EditorClip,
        timelineStart: TimeInterval,
        frame: CGRect = CGRect(x: 0.62, y: 0.06, width: 0.32, height: 0.32),
        cornerRadius: CGFloat = 12
    ) {
        self.id = id
        self.clip = clip
        self.timelineStart = timelineStart
        self.frame = frame
        self.cornerRadius = cornerRadius
    }
}

/// A Ken-Burns-style zoom/pan ramp applied across a clip's full duration.
struct ZoomKeyframe: Codable, Equatable, Sendable {
    /// Normalized scale at the start and end of the clip (1.0 = no zoom).
    var startScale: CGFloat
    var endScale: CGFloat
    /// Normalized (-1...1) pan offset at start/end, relative to frame center.
    var startOffset: CGPoint
    var endOffset: CGPoint

    static let none = ZoomKeyframe(startScale: 1, endScale: 1, startOffset: .zero, endOffset: .zero)
    static let slowPushIn = ZoomKeyframe(startScale: 1.0, endScale: 1.15, startOffset: .zero, endOffset: .zero)
    static let slowPullOut = ZoomKeyframe(startScale: 1.15, endScale: 1.0, startOffset: .zero, endOffset: .zero)
}
