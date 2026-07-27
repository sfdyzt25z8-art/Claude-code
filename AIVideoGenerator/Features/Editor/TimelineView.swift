import SwiftUI

/// Horizontal, scrubbable timeline showing every clip as a proportionally
/// sized segment. Tapping a clip selects it for trim/crop/speed/rotation
/// edits; dragging the playhead scrubs preview position.
struct TimelineView: View {
    let clips: [EditorClip]
    @Binding var selectedClipID: EditorClip.ID?
    @Binding var playheadTime: TimeInterval
    let totalDuration: TimeInterval

    private let pixelsPerSecond: CGFloat = 24

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            ZStack(alignment: .topLeading) {
                HStack(spacing: 2) {
                    ForEach(clips) { clip in
                        clipSegment(clip)
                    }
                }
                .padding(.vertical, Theme.Spacing.small)

                playhead
            }
            .padding(.horizontal, Theme.Spacing.medium)
        }
        .frame(height: 96)
        .background(.ultraThinMaterial)
    }

    private func clipSegment(_ clip: EditorClip) -> some View {
        let width = max(40, CGFloat(clip.trimmedDuration) * pixelsPerSecond)
        return RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous)
            .fill(selectedClipID == clip.id ? AnyShapeStyle(Theme.Gradients.brand) : AnyShapeStyle(Color.gray.opacity(0.35)))
            .frame(width: width, height: 64)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous)
                    .strokeBorder(selectedClipID == clip.id ? Color.white.opacity(0.6) : .clear, lineWidth: 2)
            )
            .overlay(alignment: .bottomLeading) {
                Text(String(format: "%.1fs", clip.trimmedDuration))
                    .font(.AIVG.caption)
                    .foregroundStyle(.white)
                    .padding(4)
            }
            .onTapGesture {
                withAnimation(Theme.Animation.quick) { selectedClipID = clip.id }
            }
    }

    private var playhead: some View {
        Rectangle()
            .fill(Theme.Colors.danger)
            .frame(width: 2)
            .frame(height: 80)
            .offset(x: CGFloat(playheadTime) * pixelsPerSecond)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        let newTime = max(0, min(totalDuration, Double(value.location.x / pixelsPerSecond)))
                        playheadTime = newTime
                    }
            )
    }
}
