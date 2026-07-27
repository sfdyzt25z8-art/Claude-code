import SwiftUI

/// Circular progress indicator used for generation jobs and storage usage.
struct ProgressRing: View {
    /// 0...1
    var progress: Double
    var lineWidth: CGFloat = 8
    var size: CGFloat = 64
    var gradient: LinearGradient = Theme.Gradients.brand

    var body: some View {
        ZStack {
            Circle()
                .stroke(Theme.Colors.textSecondary.opacity(0.15), lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: max(0.001, min(progress, 1)))
                .stroke(gradient, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(Theme.Animation.standard, value: progress)

            Text("\(Int(progress * 100))%")
                .font(.AIVG.captionBold)
                .foregroundStyle(Theme.Colors.textPrimary)
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Progress")
        .accessibilityValue("\(Int(progress * 100)) percent")
    }
}
