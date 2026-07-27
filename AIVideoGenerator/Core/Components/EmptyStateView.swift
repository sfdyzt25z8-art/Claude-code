import SwiftUI

/// Friendly empty state used for empty project lists, search results, etc.
struct EmptyStateView: View {
    let systemImage: String
    let title: String
    let message: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: Theme.Spacing.small) {
            Image(systemName: systemImage)
                .font(.system(size: 44, weight: .medium))
                .foregroundStyle(Theme.Gradients.brand)
                .padding(.bottom, Theme.Spacing.xSmall)

            Text(title)
                .font(.AIVG.headline)
                .foregroundStyle(Theme.Colors.textPrimary)

            Text(message)
                .font(.AIVG.subheadline)
                .foregroundStyle(Theme.Colors.textSecondary)
                .multilineTextAlignment(.center)

            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.AIVG.bodyEmphasized)
                }
                .padding(.top, Theme.Spacing.xSmall)
            }
        }
        .padding(Theme.Spacing.xLarge)
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }
}
