import SwiftUI

/// Live list of in-flight video/thumbnail jobs, each showing status, progress,
/// and an ETA. Reflects `GenerationQueueManaging.jobs` in real time.
struct GenerationQueueSection: View {
    let jobs: [GenerationJob]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Generation Queue")

            VStack(spacing: Spacing.xs) {
                ForEach(jobs) { job in
                    GlassCard(padding: Spacing.sm) {
                        HStack(spacing: Spacing.sm) {
                            Image(systemName: job.kind == .video ? "video.fill" : "photo.fill")
                                .foregroundStyle(.white)
                                .frame(width: 36, height: 36)
                                .background(Theme.brandGradient, in: Circle())

                            VStack(alignment: .leading, spacing: Spacing.xxs) {
                                Text(job.title)
                                    .font(Typography.subheadline)
                                    .foregroundStyle(Theme.primaryText)
                                    .lineLimit(1)
                                HStack(spacing: Spacing.xxs) {
                                    Text(job.status.displayName)
                                    if let eta = job.estimatedCompletion {
                                        Text("· ETA \(eta.timeIntervalSinceNow.formattedETA)")
                                    }
                                }
                                .font(Typography.caption)
                                .foregroundStyle(Theme.secondaryText)
                            }

                            Spacer()

                            ProgressRing(progress: job.progress, lineWidth: 4, diameter: 32)
                        }
                    }
                }
            }
        }
    }
}
