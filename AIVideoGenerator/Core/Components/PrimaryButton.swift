import SwiftUI

/// Primary call-to-action button with the app's signature brand gradient,
/// a pressed-state scale animation, and full Dynamic Type / VoiceOver support.
struct PrimaryButton: View {
    let title: String
    var systemImage: String?
    var isLoading: Bool = false
    var isEnabled: Bool = true
    var action: () -> Void

    @Environment(\.isEnabled) private var environmentEnabled

    private var effectivelyEnabled: Bool { isEnabled && environmentEnabled && !isLoading }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.xSmall) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                } else if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 16, weight: .semibold))
                }
                Text(title)
                    .font(.AIVG.headline)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.small + 2)
            .background(
                RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous)
                    .fill(Theme.Gradients.brand)
                    .opacity(effectivelyEnabled ? 1 : 0.4)
            )
        }
        .buttonStyle(PressableButtonStyle())
        .disabled(!effectivelyEnabled)
        .accessibilityLabel(Text(title))
        .accessibilityAddTraits(isLoading ? .updatesFrequently : [])
    }
}

/// A secondary, outlined button style for lower-emphasis actions.
struct SecondaryButton: View {
    let title: String
    var systemImage: String?
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.xSmall) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 16, weight: .semibold))
                }
                Text(title)
                    .font(.AIVG.headline)
            }
            .foregroundStyle(Theme.Colors.textPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.small + 2)
            .background(
                RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous)
                    .strokeBorder(Theme.Colors.textPrimary.opacity(0.15), lineWidth: 1.5)
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

/// Applies a subtle scale-down animation on press, matching iOS system button feel.
struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(Theme.Animation.quick, value: configuration.isPressed)
    }
}
