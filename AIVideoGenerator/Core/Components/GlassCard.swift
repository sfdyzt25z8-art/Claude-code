import SwiftUI

/// A generic, reusable glassmorphism card container used throughout the app
/// for dashboard tiles, settings rows, and option groups.
struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = Theme.Radius.large
    var padding: CGFloat = Theme.Spacing.medium
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .background(GlassBackground(cornerRadius: cornerRadius))
            .cardShadow()
    }
}

#Preview {
    ZStack {
        AuroraBackground()
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Cinematic City")
                    .font(.AIVG.headline)
                Text("1080p · 16:9 · 24fps")
                    .font(.AIVG.footnote)
                    .foregroundStyle(Theme.Colors.textSecondary)
            }
        }
        .padding()
    }
}
