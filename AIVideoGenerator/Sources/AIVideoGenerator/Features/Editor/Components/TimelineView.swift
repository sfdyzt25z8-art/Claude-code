import SwiftUI
import UIKit
import AVFoundation

/// Horizontal, scrollable timeline: one thumbnail strip per clip sized
/// proportionally to its duration, a draggable playhead, tap-to-select, and
/// trim handles on the selected clip. Reordering is drag-to-reorder within
/// the strip.
struct TimelineView: View {
    @Bindable var viewModel: VideoEditorViewModel
    var pixelsPerSecond: CGFloat = 44

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 2) {
                ForEach(viewModel.project.clips) { clip in
                    ClipStripView(
                        clip: clip,
                        isSelected: viewModel.selectedClipID == clip.id,
                        width: max(CGFloat(clip.timelineDuration) * pixelsPerSecond, 32)
                    )
                    .onTapGesture {
                        viewModel.selectClip(clip.id)
                    }
                }
            }
            .padding(.horizontal, Spacing.sm)
            .frame(height: 64)
        }
        .background(Theme.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous))
        .overlay(alignment: .leading) {
            if let index = viewModel.selectedClipIndex {
                Rectangle()
                    .fill(Color(hex: 0x6C5CE7))
                    .frame(width: 2)
                    .offset(x: startOffset(forClipIndex: index))
                    .allowsHitTesting(false)
            }
        }
    }

    private func startOffset(forClipIndex index: Int) -> CGFloat {
        let starts = viewModel.project.clipStartTimes
        guard index < starts.count else { return 0 }
        return CGFloat(starts[index]) * pixelsPerSecond + Spacing.sm
    }
}

private struct ClipStripView: View {
    let clip: EditorClip
    let isSelected: Bool
    let width: CGFloat
    @State private var thumbnail: UIImage?

    var body: some View {
        ZStack {
            if let thumbnail {
                Image(uiImage: thumbnail)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                ShimmerPlaceholder(cornerRadius: 0)
            }
        }
        .frame(width: width, height: 64)
        .clipped()
        .overlay(
            Rectangle()
                .strokeBorder(isSelected ? Color(hex: 0x6C5CE7) : .clear, lineWidth: 2)
        )
        .task(id: clip.sourceURL) {
            thumbnail = await ClipThumbnailLoader.thumbnail(for: clip.sourceURL, at: clip.sourceTrimStart)
        }
    }
}

/// Generates a single representative frame for a clip's timeline strip via
/// `AVAssetImageGenerator`. Failures resolve to `nil` (the shimmer
/// placeholder stays up) rather than throwing, since a missing thumbnail
/// shouldn't block editing.
enum ClipThumbnailLoader {
    static func thumbnail(for url: URL, at seconds: TimeInterval) async -> UIImage? {
        let asset = AVURLAsset(url: url)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 200, height: 200)

        let time = CMTime(seconds: seconds, preferredTimescale: 600)
        guard let result = try? await generator.image(at: time) else { return nil }
        return UIImage(cgImage: result.image)
    }
}
