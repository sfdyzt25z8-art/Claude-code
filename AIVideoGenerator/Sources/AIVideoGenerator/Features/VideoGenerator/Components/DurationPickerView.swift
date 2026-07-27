import SwiftUI

/// Duration slider supporting the full product range (2 seconds to 90 minutes).
/// Because the scale spans three orders of magnitude, the slider operates in
/// log-space internally while displaying a human-readable duration and, when the
/// request exceeds what the active provider can render in one shot, a notice
/// that scenes will be generated and stitched automatically.
struct DurationPickerView: View {
    @Binding var durationSeconds: TimeInterval
    let willRequireStitching: Bool
    let estimatedCompletion: TimeInterval

    private var logValue: Binding<Double> {
        Binding(
            get: { log2(max(durationSeconds, GenerationRequest.minimumDuration)) },
            set: { durationSeconds = pow(2, $0) }
        )
    }

    private var logRange: ClosedRange<Double> {
        log2(GenerationRequest.minimumDuration)...log2(GenerationRequest.maximumDuration)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Duration")

            GlassCard {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    HStack {
                        Text(durationSeconds.formattedDuration)
                            .font(Typography.headline)
                            .foregroundStyle(Theme.primaryText)
                        Spacer()
                        Text("Est. completion: \(estimatedCompletion.formattedETA)")
                            .font(Typography.caption)
                            .foregroundStyle(Theme.secondaryText)
                    }

                    Slider(value: logValue, in: logRange)
                        .tint(Color(hex: 0x6C5CE7))

                    HStack {
                        Text("2s")
                        Spacer()
                        Text("90 min")
                    }
                    .font(Typography.caption)
                    .foregroundStyle(Theme.secondaryText)

                    if willRequireStitching {
                        HStack(alignment: .top, spacing: Spacing.xs) {
                            Image(systemName: "square.stack.3d.up.fill")
                                .foregroundStyle(Theme.warning)
                            Text("This duration will be generated as multiple scenes and automatically stitched together. Progress for each scene is shown in the queue.")
                                .font(Typography.caption)
                                .foregroundStyle(Theme.secondaryText)
                        }
                        .padding(.top, Spacing.xxs)
                    }
                }
            }
        }
    }
}
