import SwiftUI

struct QuickAction: Identifiable {
    let id = UUID()
    let title: String
    let systemImage: String
    let gradient: LinearGradient
}

struct QuickActionsRow: View {
    let actions: [QuickAction]
    let onSelect: (QuickAction) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.small) {
                ForEach(actions) { action in
                    Button {
                        onSelect(action)
                    } label: {
                        VStack(spacing: Theme.Spacing.xSmall) {
                            ZStack {
                                Circle()
                                    .fill(action.gradient)
                                    .frame(width: 52, height: 52)
                                Image(systemName: action.systemImage)
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundStyle(.white)
                            }
                            Text(action.title)
                                .font(.AIVG.caption)
                                .foregroundStyle(Theme.Colors.textPrimary)
                                .lineLimit(1)
                        }
                        .frame(width: 76)
                    }
                    .buttonStyle(PressableButtonStyle())
                }
            }
            .padding(.horizontal, Theme.Spacing.medium)
        }
    }
}
