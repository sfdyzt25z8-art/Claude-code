import AVFoundation
import CoreImage
import CoreImage.CIFilterBuiltins

/// A transform that linearly interpolates between `start` and `end` across
/// `timeRange`, clamped to `start`/`end` outside it — the same semantics as
/// `AVMutableVideoCompositionLayerInstruction.setTransformRamp`, reimplemented
/// here because a custom `AVVideoCompositing` composites tracks itself and
/// does not receive the built-in compositor's ramp evaluation for free.
struct TransformRamp: Sendable {
    var start: CGAffineTransform
    var end: CGAffineTransform
    var timeRange: CMTimeRange

    static func constant(_ transform: CGAffineTransform) -> TransformRamp {
        TransformRamp(start: transform, end: transform, timeRange: CMTimeRange(start: .zero, duration: .positiveInfinity))
    }

    func transform(at time: CMTime) -> CGAffineTransform {
        let fraction = RampMath.fraction(of: time, in: timeRange)
        return CGAffineTransform(
            a: RampMath.lerp(start.a, end.a, fraction),
            b: RampMath.lerp(start.b, end.b, fraction),
            c: RampMath.lerp(start.c, end.c, fraction),
            d: RampMath.lerp(start.d, end.d, fraction),
            tx: RampMath.lerp(start.tx, end.tx, fraction),
            ty: RampMath.lerp(start.ty, end.ty, fraction)
        )
    }
}

struct OpacityRamp: Sendable {
    var start: Float
    var end: Float
    var timeRange: CMTimeRange

    static func constant(_ opacity: Float) -> OpacityRamp {
        OpacityRamp(start: opacity, end: opacity, timeRange: CMTimeRange(start: .zero, duration: .positiveInfinity))
    }

    func opacity(at time: CMTime) -> Float {
        let fraction = RampMath.fraction(of: time, in: timeRange)
        return start + (end - start) * Float(fraction)
    }
}

private enum RampMath {
    static func fraction(of time: CMTime, in range: CMTimeRange) -> CGFloat {
        let duration = CMTimeGetSeconds(range.duration)
        guard duration.isFinite, duration > 0 else { return 1 }
        let elapsed = CMTimeGetSeconds(time) - CMTimeGetSeconds(range.start)
        return CGFloat(min(max(elapsed / duration, 0), 1))
    }

    static func lerp(_ a: CGFloat, _ b: CGFloat, _ fraction: CGFloat) -> CGFloat {
        a + (b - a) * fraction
    }
}

/// One track's render parameters for a given `EditorCompositionInstruction`.
/// `cropRectNormalized` uses a top-left-origin, UIKit-style unit rectangle
/// (matching every other normalized rect in this codebase); it is flipped to
/// Core Image's bottom-left-origin space internally.
struct TrackLayerRenderDescriptor: Sendable {
    let trackID: CMPersistentTrackID
    var transformRamp: TransformRamp
    var opacityRamp: OpacityRamp
    var cropRectNormalized: CGRect?
    var colorGrade: ColorGradeSettings
    var effect: VideoEffectType?
    var cameraShakeSeed: Double
}

/// Custom `AVVideoCompositionInstructionProtocol` conformance carrying the
/// editor's own per-track render descriptors, rather than the built-in
/// `AVVideoCompositionLayerInstruction` (which only the default compositor
/// interprets).
final class EditorCompositionInstruction: NSObject, AVVideoCompositionInstructionProtocol {
    let timeRange: CMTimeRange
    let layers: [TrackLayerRenderDescriptor]
    let backgroundColor: CGColor

    let enablePostProcessing = true
    let containsTweening = true
    let passthroughTrackID = kCMPersistentTrackID_Invalid

    var requiredSourceTrackIDs: [NSValue]? {
        layers.map { NSNumber(value: $0.trackID) }
    }

    init(timeRange: CMTimeRange, layers: [TrackLayerRenderDescriptor], backgroundColor: CGColor = CGColor(red: 0, green: 0, blue: 0, alpha: 1)) {
        self.timeRange = timeRange
        self.layers = layers
        self.backgroundColor = backgroundColor
    }
}

/// Composites every active track for each frame: applies crop, color grade,
/// per-clip effects, transform (rotation/zoom/PiP/camera shake), and opacity
/// (transitions/fades), back-to-front, using `VideoEffectRenderer` for the
/// pixel-level work. Runs on a private serial queue since `startRequest` is
/// called from AVFoundation's own rendering thread(s).
final class EditorVideoCompositor: NSObject, AVVideoCompositing {
    var sourcePixelBufferAttributes: [String: Any]? = [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]

    var requiredPixelBufferAttributesForRenderContext: [String: Any] = [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]

    private let ciContext = CIContext(options: nil)
    private let renderQueue = DispatchQueue(label: "com.aivideogenerator.editor.compositor")

    func renderContextChanged(_ newRenderContext: AVVideoCompositionRenderContext) {
        // No cached state depends on the render context beyond what's read per-request.
    }

    func startRequest(_ request: AVAsynchronousVideoCompositionRequest) {
        renderQueue.async { [ciContext] in
            guard let instruction = request.videoCompositionInstruction as? EditorCompositionInstruction else {
                request.finish(with: CocoaError(.coderInvalidValue))
                return
            }

            let renderSize = request.renderContext.size
            let canvas = CGRect(origin: .zero, size: renderSize)
            var composed = CIImage(color: CIColor(cgColor: instruction.backgroundColor)).cropped(to: canvas)

            for layer in instruction.layers {
                guard let pixelBuffer = request.sourceFrame(byTrackID: layer.trackID) else { continue }
                var image = CIImage(cvPixelBuffer: pixelBuffer)

                if let crop = layer.cropRectNormalized {
                    image = Self.applyingCrop(crop, to: image)
                }

                image = VideoEffectRenderer.applyColorGrade(layer.colorGrade, to: image)
                image = VideoEffectRenderer.applyEffect(layer.effect, to: image, extent: image.extent)

                var transform = layer.transformRamp.transform(at: request.compositionTime)
                if layer.effect == .cameraShake {
                    transform = transform.concatenating(Self.shakeTransform(at: request.compositionTime, seed: layer.cameraShakeSeed))
                }
                image = image.transformed(by: transform)

                let opacity = layer.opacityRamp.opacity(at: request.compositionTime)
                image = Self.applyingOpacity(opacity, to: image)

                composed = image.composited(over: composed)
            }

            guard let outputBuffer = request.renderContext.newPixelBuffer() else {
                request.finish(with: CocoaError(.coderReadCorrupt))
                return
            }
            ciContext.render(composed, to: outputBuffer)
            request.finish(withComposedVideoFrame: outputBuffer)
        }
    }

    /// Crops `image` to a top-left-origin unit rectangle, then scales the
    /// cropped region back up to the original extent so the crop reads as a
    /// zoomed-in reframe rather than a smaller picture floating in the frame.
    private static func applyingCrop(_ normalizedRect: CGRect, to image: CIImage) -> CIImage {
        let extent = image.extent
        guard extent.width > 0, extent.height > 0 else { return image }

        let cropRect = CGRect(
            x: extent.origin.x + normalizedRect.origin.x * extent.width,
            y: extent.origin.y + (1 - normalizedRect.origin.y - normalizedRect.height) * extent.height,
            width: max(normalizedRect.width * extent.width, 1),
            height: max(normalizedRect.height * extent.height, 1)
        )

        let cropped = image.cropped(to: cropRect)
        let scaleX = extent.width / cropRect.width
        let scaleY = extent.height / cropRect.height

        return cropped
            .transformed(by: CGAffineTransform(translationX: -cropRect.origin.x, y: -cropRect.origin.y))
            .transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
    }

    private static func applyingOpacity(_ opacity: Float, to image: CIImage) -> CIImage {
        guard opacity < 0.999 else { return image }
        let matrix = CIFilter.colorMatrix()
        matrix.inputImage = image
        matrix.aVector = CIVector(x: 0, y: 0, z: 0, w: CGFloat(max(opacity, 0)))
        return matrix.outputImage ?? image
    }

    /// Deterministic pseudo-random jitter so repeated renders of the same
    /// frame produce the same shake (important for scrubbing/re-exporting).
    private static func shakeTransform(at time: CMTime, seed: Double) -> CGAffineTransform {
        let t = CMTimeGetSeconds(time) * 14 + seed
        let dx = sin(t) * 6 + sin(t * 2.7 + 1.3) * 3
        let dy = cos(t * 1.6 + 0.7) * 6 + cos(t * 3.1) * 3
        return CGAffineTransform(translationX: dx, y: dy)
    }
}
