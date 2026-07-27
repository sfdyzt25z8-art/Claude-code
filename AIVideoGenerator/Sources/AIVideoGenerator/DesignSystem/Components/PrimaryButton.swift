import SwiftUI

/// The app's primary call-to-action button: full-width, gradient-filled, with an
/// optional loading state that swaps the label for a spinner without changing layout.
struct PrimaryButton: View {
    let title: String
    var systemImage: String?
    var isLoading: Bool = false
    var isEnabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.xs) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    if let systemImage {
                        Image(systemName: systemImage)
                    }
                    Text(title)
                }
            }
            .font(Typography.button)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm + 2)
            .background(
                isEnabled ? Theme.brandGradient : LinearGradient(colors: [.gray, .gray], startPoint: .top, endPoint: .bottom)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous))
        }
        .buttonStyle(ScaleButtonStyle())
        .disabled(!isEnabled || isLoading)
        .accessibilityLabel(title)
    }
}

/// A muted, outline-style secondary button for lower-emphasis actions.
struct SecondaryButton: View {
    let title: String
    var systemImage: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.xs) {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
            }
            .font(Typography.button)
            .foregroundStyle(Theme.primaryText)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm + 2)
            .background(Theme.secondaryBackground)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous)
                    .strokeBorder(Theme.divider, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous))
        }
        .buttonStyle(ScaleButtonStyle())
        .accessibilityLabel(title)
    }
}

#Preview {
    VStack(spacing: Spacing.md) {
        PrimaryButton(title: "Generate Video", systemImage: "sparkles", action: {})
        PrimaryButton(title: "Generating…", isLoading: true, action: {})
        PrimaryButton(title: "Disabled", isEnabled: false, action: {})
        SecondaryButton(title: "Cancel", action: {})
    }
    .padding()
}
