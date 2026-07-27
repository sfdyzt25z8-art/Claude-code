import AVFoundation
import CoreMedia
import CoreGraphics
import QuartzCore

/// Turns an `EditorProject` into a real, playable/exportable
/// `AVMutableComposition` + `AVMutableVideoComposition`: inserts each clip's
/// trimmed, speed-scaled range onto one of two alternating video tracks (so
/// adjacent clips can overlap for transitions without colliding on the same
/// track), builds `EditorCompositionInstruction`s for `EditorVideoCompositor`
/// covering crop/rotate/zoom/PiP/transitions/effects, and burns in titles and
/// captions via `AVVideoCompositionCoreAnimationTool`. Audio tracks are added
/// separately by `AudioMixBuilder` onto the same composition.
enum VideoCompositionBuilder {
    struct Output {
        let composition: AVMutableComposition
        let videoComposition: AVMutableVideoComposition
    }

    private struct PlacedClip {
        let clip: EditorClip
        let trackID: CMPersistentTrackID
        let startTime: CMTime
        let naturalSize: CGSize
        let preferredTransform: CGAffineTransform
    }

    static func build(project: EditorProject) async throws -> Output {
        guard !project.clips.isEmpty else {
            throw AppError.validation("Add at least one clip before previewing or exporting.")
        }

        let composition = AVMutableComposition()
        let renderSize = renderSize(for: project)

        guard
            let trackA = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
            let trackB = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
        else {
            throw AppError.storage("Couldn't create composition video tracks.")
        }

        let startOffsets = project.clipStartTimes
        var placedClips: [PlacedClip] = []

        for (index, clip) in project.clips.enumerated() {
            let track = index.isMultiple(of: 2) ? trackA : trackB
            let placed = try await place(clip: clip, on: track, startSeconds: startOffsets[index])
            placedClips.append(placed)
        }

        var pipPlaced: PlacedClip?
        if let pip = project.pictureInPicture,
           let pipTrack = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) {
            pipPlaced = try? await place(clip: pip.clip, on: pipTrack, startSeconds: pip.timelineStart)
        }

        let instructions = buildInstructions(
            project: project,
            placedClips: placedClips,
            renderSize: renderSize,
            pipPlaced: pipPlaced
        )

        let videoComposition = AVMutableVideoComposition()
        videoComposition.renderSize = renderSize
        videoComposition.frameDuration = CMTime(value: 1, timescale: CMTimeScale(project.frameRate.rawValue))
        videoComposition.customVideoCompositorClass = EditorVideoCompositor.self
        videoComposition.instructions = instructions

        applyTitlesAndCaptions(project: project, to: videoComposition, renderSize: renderSize)

        return Output(composition: composition, videoComposition: videoComposition)
    }

    static func renderSize(for project: EditorProject) -> CGSize {
        let height = CGFloat(project.resolution.pixelHeight)
        let width = (height * project.aspectRatio.ratio).rounded()
        return CGSize(width: width, height: height)
    }

    private static func place(clip: EditorClip, on track: AVMutableCompositionTrack, startSeconds: TimeInterval) async throws -> PlacedClip {
        let asset = AVURLAsset(url: clip.sourceURL)
        guard let sourceTrack = try await asset.loadTracks(withMediaType: .video).first else {
            throw AppError.storage("Couldn't read video from \(clip.sourceURL.lastPathComponent).")
        }
        let naturalSize = try await sourceTrack.load(.naturalSize)
        let preferredTransform = try await sourceTrack.load(.preferredTransform)

        let trimRange = CMTimeRange(
            start: CMTime(seconds: clip.sourceTrimStart, preferredTimescale: 600),
            end: CMTime(seconds: clip.sourceTrimEnd, preferredTimescale: 600)
        )
        let insertTime = CMTime(seconds: startSeconds, preferredTimescale: 600)
        try track.insertTimeRange(trimRange, of: sourceTrack, at: insertTime)

        if clip.speed != 1, clip.speed > 0 {
            let insertedRange = CMTimeRange(start: insertTime, duration: trimRange.duration)
            let scaledDuration = CMTime(seconds: clip.timelineDuration, preferredTimescale: 600)
            track.scaleTimeRange(insertedRange, toDuration: scaledDuration)
        }

        return PlacedClip(clip: clip, trackID: track.trackID, startTime: insertTime, naturalSize: naturalSize, preferredTransform: preferredTransform)
    }

    // MARK: - Instructions

    private static func buildInstructions(
        project: EditorProject,
        placedClips: [PlacedClip],
        renderSize: CGSize,
        pipPlaced: PlacedClip?
    ) -> [EditorCompositionInstruction] {
        guard !placedClips.isEmpty else { return [] }

        let clipRanges: [(start: TimeInterval, end: TimeInterval)] = placedClips.map {
            let start = CMTimeGetSeconds($0.startTime)
            return (start, start + $0.clip.timelineDuration)
        }

        var breakpoints = Set<TimeInterval>()
        for range in clipRanges {
            breakpoints.insert(range.start)
            breakpoints.insert(range.end)
        }
        for (index, placedClip) in placedClips.enumerated() where index < placedClips.count - 1 {
            let clip = placedClip.clip
            guard clip.transition == .fadeToBlack || clip.transition == .fadeToWhite else { continue }
            let windowStart = clipRanges[index].end - clip.transitionDuration
            breakpoints.insert(windowStart + clip.transitionDuration / 2)
        }
        if let pipPlaced {
            let pipStart = CMTimeGetSeconds(pipPlaced.startTime)
            breakpoints.insert(pipStart)
            breakpoints.insert(pipStart + pipPlaced.clip.timelineDuration)
        }

        let sorted = breakpoints.sorted()
        var instructions: [EditorCompositionInstruction] = []

        for i in 0..<max(sorted.count - 1, 0) {
            let subStart = sorted[i]
            let subEnd = sorted[i + 1]
            guard subEnd - subStart > 0.001 else { continue }
            let midpoint = (subStart + subEnd) / 2
            var backgroundColor = CGColor(gray: 0, alpha: 1)

            var layers: [TrackLayerRenderDescriptor] = []

            for (index, placedClip) in placedClips.enumerated() {
                let (start, end) = clipRanges[index]
                guard midpoint >= start, midpoint < end else { continue }

                guard let descriptor = layerDescriptor(
                    forClipAt: index,
                    placedClips: placedClips,
                    clipRanges: clipRanges,
                    subStart: subStart,
                    subEnd: subEnd,
                    midpoint: midpoint,
                    renderSize: renderSize,
                    backgroundColor: &backgroundColor
                ) else { continue }

                layers.append(descriptor)
            }

            if let pipPlaced, let pip = project.pictureInPicture {
                let pipStart = CMTimeGetSeconds(pipPlaced.startTime)
                let pipEnd = pipStart + pipPlaced.clip.timelineDuration
                if midpoint >= pipStart, midpoint < pipEnd {
                    layers.append(pipDescriptor(pip: pip, pipPlaced: pipPlaced, pipStart: pipStart, midpoint: midpoint, renderSize: renderSize))
                }
            }

            guard !layers.isEmpty else { continue }

            let timeRange = CMTimeRange(
                start: CMTime(seconds: subStart, preferredTimescale: 600),
                duration: CMTime(seconds: subEnd - subStart, preferredTimescale: 600)
            )
            instructions.append(EditorCompositionInstruction(timeRange: timeRange, layers: layers, backgroundColor: backgroundColor))
        }

        return instructions
    }

    /// Builds the render descriptor for `placedClips[index]` over `[subStart, subEnd)`,
    /// or `nil` if this clip isn't drawn during that sub-range (e.g. the "other side"
    /// of a two-phase fade-to-color transition).
    private static func layerDescriptor(
        forClipAt index: Int,
        placedClips: [PlacedClip],
        clipRanges: [(start: TimeInterval, end: TimeInterval)],
        subStart: TimeInterval,
        subEnd: TimeInterval,
        midpoint: TimeInterval,
        renderSize: CGSize,
        backgroundColor: inout CGColor
    ) -> TrackLayerRenderDescriptor? {
        let placedClip = placedClips[index]
        let clip = placedClip.clip
        let (start, end) = clipRanges[index]

        var opacityStart: Float = 1
        var opacityEnd: Float = 1

        // This clip fading OUT into the next one.
        if index < placedClips.count - 1, !clip.transition.isNone {
            let transitionStart = end - clip.transitionDuration
            if subStart >= transitionStart - 0.001 {
                switch clip.transition {
                case .crossDissolve:
                    opacityStart = Float(1 - (subStart - transitionStart) / clip.transitionDuration)
                    opacityEnd = Float(1 - (subEnd - transitionStart) / clip.transitionDuration)
                case .fadeToBlack, .fadeToWhite:
                    let half = clip.transitionDuration / 2
                    guard subEnd <= transitionStart + half + 0.001 else { return nil }
                    opacityStart = Float(1 - (subStart - transitionStart) / half)
                    opacityEnd = Float(1 - (subEnd - transitionStart) / half)
                    backgroundColor = clip.transition == .fadeToBlack ? CGColor(gray: 0, alpha: 1) : CGColor(gray: 1, alpha: 1)
                case .cut:
                    break
                }
            }
        }

        // The PREVIOUS clip fading IN to this one.
        if index > 0 {
            let previousClip = placedClips[index - 1].clip
            if !previousClip.transition.isNone {
                let (_, prevEnd) = clipRanges[index - 1]
                let transitionStart = prevEnd - previousClip.transitionDuration
                if subStart >= transitionStart - 0.001, subStart < prevEnd + 0.001 {
                    switch previousClip.transition {
                    case .crossDissolve:
                        opacityStart = Float((subStart - transitionStart) / previousClip.transitionDuration)
                        opacityEnd = Float((subEnd - transitionStart) / previousClip.transitionDuration)
                    case .fadeToBlack, .fadeToWhite:
                        let half = previousClip.transitionDuration / 2
                        let secondHalfStart = transitionStart + half
                        guard subStart >= secondHalfStart - 0.001 else { return nil }
                        opacityStart = Float((subStart - secondHalfStart) / half)
                        opacityEnd = Float((subEnd - secondHalfStart) / half)
                        backgroundColor = previousClip.transition == .fadeToBlack ? CGColor(gray: 0, alpha: 1) : CGColor(gray: 1, alpha: 1)
                    case .cut:
                        break
                    }
                }
            }
        }

        let localFraction = CGFloat((midpoint - start) / max(clip.timelineDuration, 0.0001))
        let transform = VideoGeometry.composedTransform(
            naturalSize: placedClip.naturalSize,
            preferredTransform: placedClip.preferredTransform,
            renderSize: renderSize,
            rotationDegrees: clip.rotationDegrees,
            zoomKeyframe: clip.zoomKeyframe ?? .none,
            fraction: localFraction
        )

        return TrackLayerRenderDescriptor(
            trackID: placedClip.trackID,
            transformRamp: .constant(transform),
            opacityRamp: OpacityRamp(
                start: opacityStart,
                end: opacityEnd,
                timeRange: CMTimeRange(
                    start: CMTime(seconds: subStart, preferredTimescale: 600),
                    duration: CMTime(seconds: subEnd - subStart, preferredTimescale: 600)
                )
            ),
            cropRectNormalized: clip.cropRect,
            colorGrade: clip.colorGrade,
            effect: clip.effect,
            cameraShakeSeed: Double(abs(clip.id.hashValue % 1000))
        )
    }

    private static func pipDescriptor(
        pip: PictureInPictureLayer,
        pipPlaced: PlacedClip,
        pipStart: TimeInterval,
        midpoint: TimeInterval,
        renderSize: CGSize
    ) -> TrackLayerRenderDescriptor {
        let targetRect = CGRect(
            x: pip.frame.origin.x * renderSize.width,
            y: (1 - pip.frame.origin.y - pip.frame.height) * renderSize.height,
            width: pip.frame.width * renderSize.width,
            height: pip.frame.height * renderSize.height
        )
        let localFraction = CGFloat((midpoint - pipStart) / max(pip.clip.timelineDuration, 0.0001))
        let transform = VideoGeometry.composedTransform(
            naturalSize: pipPlaced.naturalSize,
            preferredTransform: pipPlaced.preferredTransform,
            renderSize: renderSize,
            rotationDegrees: pip.clip.rotationDegrees,
            zoomKeyframe: pip.clip.zoomKeyframe ?? .none,
            fraction: localFraction,
            fitting: targetRect
        )

        return TrackLayerRenderDescriptor(
            trackID: pipPlaced.trackID,
            transformRamp: .constant(transform),
            opacityRamp: .constant(1),
            cropRectNormalized: pip.clip.cropRect,
            colorGrade: pip.clip.colorGrade,
            effect: pip.clip.effect,
            cameraShakeSeed: 0
        )
    }

    // MARK: - Titles & captions

    private static func applyTitlesAndCaptions(project: EditorProject, to videoComposition: AVMutableVideoComposition, renderSize: CGSize) {
        guard !project.titles.isEmpty || !project.captions.isEmpty else { return }

        let parentLayer = CALayer()
        let videoLayer = CALayer()
        parentLayer.frame = CGRect(origin: .zero, size: renderSize)
        videoLayer.frame = CGRect(origin: .zero, size: renderSize)
        parentLayer.addSublayer(videoLayer)

        for title in project.titles {
            let layer = makeTextLayer(
                text: title.text,
                center: title.position,
                fontSize: title.fontSize,
                colorHex: title.colorHex,
                alignment: title.alignment,
                renderSize: renderSize
            )
            layer.opacity = 0
            layer.add(visibilityAnimation(start: title.timelineStart, duration: title.duration), forKey: "visibility")
            parentLayer.addSublayer(layer)
        }

        for caption in project.captions {
            let layer = makeTextLayer(
                text: caption.text,
                center: CGPoint(x: 0.5, y: 0.88),
                fontSize: 34,
                colorHex: "#FFFFFF",
                alignment: .center,
                renderSize: renderSize
            )
            layer.opacity = 0
            layer.add(visibilityAnimation(start: caption.timelineStart, duration: caption.duration), forKey: "visibility")
            parentLayer.addSublayer(layer)
        }

        videoComposition.animationTool = AVVideoCompositionCoreAnimationTool(postProcessingAsVideoLayer: videoLayer, in: parentLayer)
    }

    private static func makeTextLayer(
        text: String,
        center: CGPoint,
        fontSize: CGFloat,
        colorHex: String,
        alignment: TitleOverlay.TextAlignment,
        renderSize: CGSize
    ) -> CATextLayer {
        let layer = CATextLayer()
        layer.string = text
        layer.fontSize = fontSize
        layer.foregroundColor = cgColor(fromHex: colorHex)
        layer.alignmentMode = {
            switch alignment {
            case .left: return .left
            case .center: return .center
            case .right: return .right
            }
        }()
        layer.isWrapped = true
        layer.truncationMode = .none
        layer.contentsScale = 2

        let width = renderSize.width * 0.86
        let height = fontSize * 1.8
        let flippedCenterY = renderSize.height * (1 - center.y)
        layer.frame = CGRect(
            x: renderSize.width * center.x - width / 2,
            y: flippedCenterY - height / 2,
            width: width,
            height: height
        )
        return layer
    }

    private static func visibilityAnimation(start: TimeInterval, duration: TimeInterval) -> CAKeyframeAnimation {
        let animation = CAKeyframeAnimation(keyPath: "opacity")
        animation.values = [0, 1, 1, 0]
        animation.keyTimes = [0, 0.02, 0.92, 1]
        animation.duration = max(duration, 0.05)
        animation.beginTime = AVCoreAnimationBeginTimeAtZero + start
        animation.isRemovedOnCompletion = false
        animation.fillMode = .forwards
        return animation
    }

    private static func cgColor(fromHex hex: String) -> CGColor {
        var sanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        sanitized.removeAll { $0 == "#" }
        guard sanitized.count == 6, let value = UInt32(sanitized, radix: 16) else {
            return CGColor(gray: 1, alpha: 1)
        }
        let red = CGFloat((value & 0xFF0000) >> 16) / 255
        let green = CGFloat((value & 0x00FF00) >> 8) / 255
        let blue = CGFloat(value & 0x0000FF) / 255
        return CGColor(red: red, green: green, blue: blue, alpha: 1)
    }
}
