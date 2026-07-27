import SwiftUI

/// Lets the user request durations up to 90 minutes. Durations beyond a
/// single provider call are automatically split into scenes and stitched
/// together, communicated here via an inline estimate.
struct DurationPickerView: View {
    @Binding var duration: VideoDuration
    let estimatedCompletionText: String
    let allowsLongForm: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
            HStack {
                Text("Duration")
                    .font(.AIVG.bodyEmphasized)
                Spacer()
                Text(duration.formatted)
                    .font(.AIVG.headline)
                    .foregroundStyle(Theme.Colors.accentPrimary)
            }

            Slider(
                value: Binding(
                    get: { sliderPosition(for: duration.seconds) },
                    set: { duration.seconds = seconds(forSliderPosition: $0) }
                ),
                in: 0...1
            )
            .tint(Theme.Colors.accentPrimary)

            HStack {
                Text("3s")
                Spacer()
                Text("90 min")
            }
            .font(.AIVG.caption)
            .foregroundStyle(Theme.Colors.textTertiary)

            if duration.seconds > 12 {
                Label {
                    Text("Long-form request — automatically generated as multiple scenes and stitched together. Estimated completion: \(estimatedCompletionText).")
                } icon: {
                    Image(systemName: "film.stack")
                }
                .font(.AIVG.footnote)
                .foregroundStyle(Theme.Colors.textSecondary)
                .padding(Theme.Spacing.small)
                .glassCard(cornerRadius: Theme.Radius.medium, padding: 0)
            }

            if !allowsLongForm && duration.seconds > 60 {
                Label("Upgrade your plan to unlock generations longer than 60 seconds.", systemImage: "lock.fill")
                    .font(.AIVG.footnote)
                    .foregroundStyle(Theme.Colors.warning)
            }
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }

    /// Maps the linear slider (0...1) onto a perceptually useful curve so
    /// short clips (the common case) get more precision than the long tail.
    private func sliderPosition(for seconds: TimeInterval) -> Double {
        let normalized = (seconds - VideoDuration.minimum) / (VideoDuration.maximum - VideoDuration.minimum)
        return pow(normalized, 1.0 / 3.0)
    }

    private func seconds(forSliderPosition position: Double) -> TimeInterval {
        let normalized = pow(position, 3)
        return VideoDuration.minimum + normalized * (VideoDuration.maximum - VideoDuration.minimum)
    }
}
