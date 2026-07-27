import CoreGraphics

/// Pure transform math shared by `VideoCompositionBuilder` (which bakes a
/// `TransformRamp` per clip per instruction) and previews. Every normalized
/// rect/point/offset in this codebase is top-left-origin (UIKit-style);
/// callers that hand values to Core Image (bottom-left-origin) are
/// responsible for flipping, not this type.
enum VideoGeometry {
    /// Scales+translates a source of `naturalSize` (after `preferredTransform`
    /// orientation correction) to fill `renderSize`, cropping any overflow —
    /// the standard "aspect fill" composition transform.
    static func aspectFillTransform(naturalSize: CGSize, preferredTransform: CGAffineTransform, renderSize: CGSize) -> CGAffineTransform {
        let displayedRect = CGRect(origin: .zero, size: naturalSize).applying(preferredTransform)
        let displayedSize = CGSize(width: abs(displayedRect.width), height: abs(displayedRect.height))
        guard displayedSize.width > 0, displayedSize.height > 0 else { return preferredTransform }

        let scale = max(renderSize.width / displayedSize.width, renderSize.height / displayedSize.height)
        let tx = (renderSize.width - displayedSize.width * scale) / 2
        let ty = (renderSize.height - displayedSize.height * scale) / 2

        return preferredTransform
            .concatenating(CGAffineTransform(scaleX: scale, y: scale))
            .concatenating(CGAffineTransform(translationX: tx, y: ty))
    }

    /// Scales+translates a source of `naturalSize` to fit entirely within
    /// `targetRect` (a pixel-space rect within the render canvas) — used for
    /// picture-in-picture, which should never crop the secondary clip.
    static func aspectFitTransform(naturalSize: CGSize, preferredTransform: CGAffineTransform, targetRect: CGRect) -> CGAffineTransform {
        let displayedRect = CGRect(origin: .zero, size: naturalSize).applying(preferredTransform)
        let displayedSize = CGSize(width: abs(displayedRect.width), height: abs(displayedRect.height))
        guard displayedSize.width > 0, displayedSize.height > 0 else { return preferredTransform }

        let scale = min(targetRect.width / displayedSize.width, targetRect.height / displayedSize.height)
        let scaledWidth = displayedSize.width * scale
        let scaledHeight = displayedSize.height * scale
        let tx = targetRect.origin.x + (targetRect.width - scaledWidth) / 2
        let ty = targetRect.origin.y + (targetRect.height - scaledHeight) / 2

        return preferredTransform
            .concatenating(CGAffineTransform(scaleX: scale, y: scale))
            .concatenating(CGAffineTransform(translationX: tx, y: ty))
    }

    /// Applies rotation (degrees, clockwise) around the render canvas's center,
    /// on top of an already-canvas-filling transform.
    static func rotationTransform(degrees: Double, renderSize: CGSize) -> CGAffineTransform {
        guard degrees != 0 else { return .identity }
        let radians = degrees * .pi / 180
        let center = CGPoint(x: renderSize.width / 2, y: renderSize.height / 2)
        return CGAffineTransform(translationX: center.x, y: center.y)
            .rotated(by: radians)
            .translatedBy(x: -center.x, y: -center.y)
    }

    /// Ken-Burns zoom/pan transform at a given fraction (0...1) through a
    /// clip's `ZoomKeyframe`, around the render canvas's center.
    static func zoomTransform(_ keyframe: ZoomKeyframe, fraction: CGFloat, renderSize: CGSize) -> CGAffineTransform {
        let clamped = min(max(fraction, 0), 1)
        let scale = lerp(keyframe.startScale, keyframe.endScale, clamped)
        let offsetX = lerp(keyframe.startOffset.x, keyframe.endOffset.x, clamped)
        let offsetY = lerp(keyframe.startOffset.y, keyframe.endOffset.y, clamped)

        let center = CGPoint(x: renderSize.width / 2, y: renderSize.height / 2)
        let panX = offsetX * (renderSize.width / 2)
        let panY = offsetY * (renderSize.height / 2)

        return CGAffineTransform(translationX: center.x, y: center.y)
            .scaledBy(x: scale, y: scale)
            .translatedBy(x: -center.x + panX, y: -center.y + panY)
    }

    /// Composes the full per-clip transform (fill/fit + rotation + zoom) at a
    /// given fraction through the clip.
    static func composedTransform(
        naturalSize: CGSize,
        preferredTransform: CGAffineTransform,
        renderSize: CGSize,
        rotationDegrees: Double,
        zoomKeyframe: ZoomKeyframe,
        fraction: CGFloat,
        fitting targetRect: CGRect? = nil
    ) -> CGAffineTransform {
        let base = targetRect.map {
            aspectFitTransform(naturalSize: naturalSize, preferredTransform: preferredTransform, targetRect: $0)
        } ?? aspectFillTransform(naturalSize: naturalSize, preferredTransform: preferredTransform, renderSize: renderSize)

        let rotation = rotationTransform(degrees: rotationDegrees, renderSize: renderSize)
        let zoom = zoomTransform(zoomKeyframe, fraction: fraction, renderSize: renderSize)

        return base.concatenating(rotation).concatenating(zoom)
    }

    private static func lerp(_ a: CGFloat, _ b: CGFloat, _ fraction: CGFloat) -> CGFloat {
        a + (b - a) * fraction
    }
}
