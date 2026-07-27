import SwiftUI

struct StorageUsageCard: View {
    let usage: StorageUsage

    var body: some View {
        GlassCard {
            HStack(spacing: Theme.Spacing.medium) {
                ProgressRing(progress: usage.fraction, lineWidth: 6, size: 48)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Storage Usage")
                        .font(.AIVG.bodyEmphasized)
                    Text("\(usage.formattedUsed) of \(usage.formattedQuota) used")
                        .font(.AIVG.footnote)
                        .foregroundStyle(Theme.Colors.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.Colors.textTertiary)
            }
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }
}
