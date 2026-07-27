import SwiftUI

/// Shown after submission: confirms the job was queued and links back to the
/// live Generation Queue on Home rather than blocking the sheet on a spinner,
/// since long-duration requests may take many minutes to complete.
struct GenerationProgressView: View {
    let job: GenerationJob
    let onDone: () -> Void

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Spacer()

            ProgressRing(progress: job.progress, diameter: 96)

            VStack(spacing: Spacing.xs) {
                Text("Your video is generating")
                    .font(Typography.title)
                    .foregroundStyle(Theme.primaryText)

                Text("You can keep browsing — track progress anytime from the Generation Queue on Home.")
                    .font(Typography.subheadline)
                    .foregroundStyle(Theme.secondaryText)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Spacing.lg)
            }

            Spacer()

            PrimaryButton(title: "Done", action: onDone)
                .padding(.horizontal, Spacing.lg)
        }
        .padding(.vertical, Spacing.xl)
    }
}
