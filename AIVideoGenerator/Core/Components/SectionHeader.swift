import SwiftUI

/// Consistent section title used across the dashboard and option pickers,
/// with an optional trailing "See All" style action.
struct SectionHeader: View {
    let title: String
    var subtitle: String? = nil
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.AIVG.title3)
                    .foregroundStyle(Theme.Colors.textPrimary)
                if let subtitle {
                    Text(subtitle)
                        .font(.AIVG.footnote)
                        .foregroundStyle(Theme.Colors.textSecondary)
                }
            }

            Spacer()

            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.AIVG.subheadline)
                        .foregroundStyle(Theme.Colors.accentPrimary)
                }
            }
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }
}
