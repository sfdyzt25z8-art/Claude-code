import SwiftUI

/// A consistent section title row, with an optional trailing "See All" action,
/// used to introduce every horizontal/vertical section on the dashboard.
struct SectionHeader: View {
    let title: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(Typography.headline)
                .foregroundStyle(Theme.primaryText)

            Spacer()

            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(Typography.subheadline)
                        .foregroundStyle(Theme.secondaryText)
                }
            }
        }
    }
}
