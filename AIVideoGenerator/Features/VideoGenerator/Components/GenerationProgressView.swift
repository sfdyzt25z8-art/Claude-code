import SwiftUI

/// Shows live progress for an in-flight job, including per-scene breakdown
/// for long-duration requests that were split by the stitching pipeline.
struct GenerationProgressView: View {
    let job: GenerationJob

    var body: some View {
        VStack(spacing: Theme.Spacing.medium) {
            ProgressRing(progress: job.progress, size: 88)

            Text(job.status.displayName)
                .font(.AIVG.headline)

            if let estimatedCompletionAt = job.estimatedCompletionAt, !job.status.isTerminal {
                Text("Estimated completion \(estimatedCompletionAt, style: .relative)")
                    .font(.AIVG.footnote)
                    .foregroundStyle(Theme.Colors.textSecondary)
            }

            if job.scenes.count > 1 {
                VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                    Text("Scenes (\(job.scenes.filter { $0.status == .completed }.count)/\(job.scenes.count))")
                        .font(.AIVG.caption)
                        .foregroundStyle(Theme.Colors.textSecondary)

                    ForEach(job.scenes) { scene in
                        HStack(spacing: Theme.Spacing.xSmall) {
                            Image(systemName: sceneIcon(scene.status))
                                .foregroundStyle(sceneColor(scene.status))
                                .frame(width: 18)
                            Text("Scene \(scene.index + 1)")
                                .font(.AIVG.footnote)
                            Spacer()
                            if scene.status == .generating {
                                Text("\(Int(scene.progress * 100))%")
                                    .font(.AIVG.caption)
                                    .foregroundStyle(Theme.Colors.textSecondary)
                            }
                        }
                    }
                }
                .padding(Theme.Spacing.small)
                .glassCard(padding: Theme.Spacing.small)
            }

            if job.status == .failed, let errorMessage = job.errorMessage {
                Text(errorMessage)
                    .font(.AIVG.footnote)
                    .foregroundStyle(Theme.Colors.danger)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(Theme.Spacing.large)
    }

    private func sceneIcon(_ status: GeneratedScene.Status) -> String {
        switch status {
        case .queued: "circle"
        case .generating: "circle.dotted"
        case .completed: "checkmark.circle.fill"
        case .failed: "xmark.circle.fill"
        }
    }

    private func sceneColor(_ status: GeneratedScene.Status) -> Color {
        switch status {
        case .queued: Theme.Colors.textTertiary
        case .generating: Theme.Colors.accentPrimary
        case .completed: Theme.Colors.success
        case .failed: Theme.Colors.danger
        }
    }
}
