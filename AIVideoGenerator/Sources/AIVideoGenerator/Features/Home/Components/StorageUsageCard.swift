import SwiftUI

/// Shows on-device storage consumed by generated media against the plan's limit.
struct StorageUsageCard: View {
    let usedFraction: Double
    let usedBytes: Int64
    let limitBytes: Int64

    private var formatter: ByteCountFormatter {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Storage Usage")

            GlassCard {
                HStack(spacing: Spacing.md) {
                    ProgressRing(progress: usedFraction, lineWidth: 6, diameter: 48)

                    VStack(alignment: .leading, spacing: Spacing.xxs) {
                        Text("\(formatter.string(fromByteCount: usedBytes)) of \(formatter.string(fromByteCount: limitBytes)) used")
                            .font(Typography.subheadline)
                            .foregroundStyle(Theme.primaryText)
                        Text("Manage storage in Settings")
                            .font(Typography.caption)
                            .foregroundStyle(Theme.secondaryText)
                    }

                    Spacer()
                }
            }
        }
    }
}
