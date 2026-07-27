import SwiftUI

/// A frosted-glass container used for dashboard cards, sheets, and pickers.
/// Wraps `.ultraThinMaterial` with a subtle border and shadow so content placed
/// inside reads clearly in both Light and Dark Mode.
struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = Theme.Radius.medium
    var padding: CGFloat = Spacing.md
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(Theme.divider, lineWidth: 1)
            )
            .shadow(color: Theme.Shadow.card, radius: 16, x: 0, y: 8)
    }
}

/// A large, tappable hero card (used for "Create Video" / "Create Thumbnail") with a
/// gradient background, icon, title, and subtitle.
struct HeroActionCard: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let gradient: LinearGradient
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Spacing.sm) {
                Image(systemName: systemImage)
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 52, height: 52)
                    .background(.white.opacity(0.18), in: Circle())

                Spacer(minLength: Spacing.lg)

                Text(title)
                    .font(Typography.title)
                    .foregroundStyle(.white)

                Text(subtitle)
                    .font(Typography.subheadline)
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(2)
            }
            .padding(Spacing.lg)
            .frame(maxWidth: .infinity, minHeight: 168, alignment: .topLeading)
            .background(gradient, in: RoundedRectangle(cornerRadius: Theme.Radius.large, style: .continuous))
            .shadow(color: Theme.Shadow.card, radius: 20, x: 0, y: 10)
        }
        .buttonStyle(ScaleButtonStyle())
        .accessibilityElement(children: .combine)
        .accessibilityHint("Double tap to \(title.lowercased())")
    }
}

/// A button style that scales down slightly on press for a tactile, premium feel.
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

#Preview {
    VStack(spacing: Spacing.md) {
        HeroActionCard(
            title: "Create Video",
            subtitle: "Turn a text prompt into a cinematic AI-generated video.",
            systemImage: "video.badge.waveform",
            gradient: Theme.brandGradient,
            action: {}
        )
        GlassCard {
            Text("Glass card content")
        }
    }
    .padding()
    .background(Theme.background)
}
