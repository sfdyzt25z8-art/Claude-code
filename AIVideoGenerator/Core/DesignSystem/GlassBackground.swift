import SwiftUI

/// A frosted, translucent surface that mimics Apple's system materials while
/// remaining fully custom so it renders identically across OS versions.
struct GlassBackground: View {
    var cornerRadius: CGFloat = Theme.Radius.large
    var material: Material = .ultraThinMaterial

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(material)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Theme.Gradients.glassOverlay(colorScheme: colorScheme))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(Theme.Colors.glassStroke, lineWidth: 1)
            )
    }
}

/// A full-bleed animated background used behind the main dashboard and
/// generation screens to create a premium, atmospheric feel.
struct AuroraBackground: View {
    @State private var animate = false

    var body: some View {
        ZStack {
            (Theme.Colors.background)
                .ignoresSafeArea()

            GeometryReader { proxy in
                ZStack {
                    blob(color: Theme.Colors.brandGradientStart, size: proxy.size.width * 0.9)
                        .offset(x: animate ? -proxy.size.width * 0.2 : -proxy.size.width * 0.35,
                                y: animate ? -proxy.size.height * 0.25 : -proxy.size.height * 0.15)

                    blob(color: Theme.Colors.brandGradientEnd, size: proxy.size.width * 0.8)
                        .offset(x: animate ? proxy.size.width * 0.3 : proxy.size.width * 0.15,
                                y: animate ? proxy.size.height * 0.15 : proxy.size.height * 0.3)

                    blob(color: Theme.Colors.brandGradientMid, size: proxy.size.width * 0.6)
                        .offset(x: animate ? proxy.size.width * 0.05 : -proxy.size.width * 0.05,
                                y: animate ? proxy.size.height * 0.45 : proxy.size.height * 0.55)
                }
            }
            .blur(radius: 80)
            .opacity(0.35)
            .ignoresSafeArea()
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 14).repeatForever(autoreverses: true)) {
                animate.toggle()
            }
        }
        .accessibilityHidden(true)
    }

    private func blob(color: Color, size: CGFloat) -> some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
    }
}

extension View {
    /// Wraps the view in a frosted glass card with a soft shadow.
    func glassCard(cornerRadius: CGFloat = Theme.Radius.large, padding: CGFloat = Theme.Spacing.medium) -> some View {
        self
            .padding(padding)
            .background(GlassBackground(cornerRadius: cornerRadius))
            .cardShadow()
    }
}
