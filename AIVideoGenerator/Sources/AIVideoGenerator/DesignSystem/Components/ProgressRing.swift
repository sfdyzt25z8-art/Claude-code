import SwiftUI

/// A circular progress indicator used for generation progress and storage usage,
/// with a smoothly animated sweep and a centered label.
struct ProgressRing: View {
    let progress: Double
    var lineWidth: CGFloat = 8
    var diameter: CGFloat = 64
    var ringColor: AnyShapeStyle = AnyShapeStyle(Theme.brandGradient)

    var body: some View {
        ZStack {
            Circle()
                .stroke(Theme.divider, lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: max(0, min(progress, 1)))
                .stroke(ringColor, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.4), value: progress)

            Text("\(Int(progress * 100))%")
                .font(Typography.caption)
                .foregroundStyle(Theme.secondaryText)
        }
        .frame(width: diameter, height: diameter)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(Int(progress * 100)) percent complete")
    }
}

/// A shimmering placeholder block shown while thumbnails or metadata are loading.
struct ShimmerPlaceholder: View {
    var cornerRadius: CGFloat = Theme.Radius.small
    @State private var phase: CGFloat = -1

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Theme.secondaryBackground)
            .overlay(
                LinearGradient(
                    colors: [.clear, Color.white.opacity(0.35), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .rotationEffect(.degrees(20))
                .offset(x: phase * 240)
                .clipped()
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .onAppear {
                withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                    phase = 1
                }
            }
            .accessibilityHidden(true)
    }
}

#Preview {
    VStack(spacing: Spacing.lg) {
        ProgressRing(progress: 0.62)
        ShimmerPlaceholder().frame(width: 160, height: 90)
    }
    .padding()
}
