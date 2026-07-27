import Foundation
import CoreGraphics

/// A single clip on the editor timeline. Multiple clips are composited
/// together (see ``VideoCompositionExporter``) to produce the final export.
struct EditorClip: Identifiable, Equatable {
    let id: UUID
    var sourceURL: URL
    var trimStart: TimeInterval
    var trimEnd: TimeInterval
    var speed: Double
    var rotationDegrees: Double
    var cropRect: CGRect?
    var transitionToNext: Transition

    enum Transition: String, CaseIterable, Identifiable, Hashable {
        case none, crossDissolve, fade, wipe, slide

        var id: String { rawValue }
        var displayName: String {
            switch self {
            case .none: "None"
            case .crossDissolve: "Cross Dissolve"
            case .fade: "Fade"
            case .wipe: "Wipe"
            case .slide: "Slide"
            }
        }
    }

    init(
        id: UUID = UUID(),
        sourceURL: URL,
        trimStart: TimeInterval = 0,
        trimEnd: TimeInterval,
        speed: Double = 1.0,
        rotationDegrees: Double = 0,
        cropRect: CGRect? = nil,
        transitionToNext: Transition = .none
    ) {
        self.id = id
        self.sourceURL = sourceURL
        self.trimStart = trimStart
        self.trimEnd = trimEnd
        self.speed = speed
        self.rotationDegrees = rotationDegrees
        self.cropRect = cropRect
        self.transitionToNext = transitionToNext
    }

    var trimmedDuration: TimeInterval {
        max(0, (trimEnd - trimStart) / speed)
    }
}

/// A text title/caption overlay burned into the export or kept as a
/// separately exportable subtitle track.
struct TitleOverlay: Identifiable, Equatable {
    let id: UUID
    var text: String
    var startTime: TimeInterval
    var endTime: TimeInterval
    var fontSizeScale: Double

    init(id: UUID = UUID(), text: String, startTime: TimeInterval, endTime: TimeInterval, fontSizeScale: Double = 1.0) {
        self.id = id
        self.text = text
        self.startTime = startTime
        self.endTime = endTime
        self.fontSizeScale = fontSizeScale
    }
}
