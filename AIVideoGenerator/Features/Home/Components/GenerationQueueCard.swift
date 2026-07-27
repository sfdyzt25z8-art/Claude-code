import SwiftUI

struct GenerationQueueCard: View {
    let jobs: [GenerationJob]
    var onCancel: (GenerationJob) -> Void

    var body: some View {
        if !jobs.isEmpty {
            VStack(alignment: .leading, spacing: Theme.Spacing.small) {
                SectionHeader(title: "Generation Queue", subtitle: "\(jobs.count) active")

                VStack(spacing: Theme.Spacing.xSmall) {
                    ForEach(jobs) { job in
                        GlassCard(padding: Theme.Spacing.small) {
                            HStack(spacing: Theme.Spacing.small) {
                                ProgressRing(progress: job.progress, lineWidth: 4, size: 36)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(job.title)
                                        .font(.AIVG.subheadline)
                                        .lineLimit(1)
                                    Text(job.status.displayName)
                                        .font(.AIVG.caption)
                                        .foregroundStyle(Theme.Colors.textSecondary)
                                }

                                Spacer()

                                Button {
                                    onCancel(job)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(Theme.Colors.textTertiary)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Theme.Spacing.medium)
            }
        }
    }
}
