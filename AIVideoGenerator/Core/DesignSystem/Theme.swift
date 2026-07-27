import SwiftUI

/// Centralized design tokens for AI Video Generator.
///
/// All colors, gradients, spacing, corner radii, and typography used across
/// the app flow through `Theme` so the product can be re-skinned or made to
/// support additional appearances without touching feature code.
enum Theme {

    // MARK: - Brand Colors

    enum Colors {
        static let accentPrimary = Color("AccentColor", bundle: .main)
        static let accentSecondary = Color(hue: 0.58, saturation: 0.85, brightness: 0.95)

        static let brandGradientStart = Color(red: 0.42, green: 0.29, blue: 0.98)
        static let brandGradientMid = Color(red: 0.75, green: 0.29, blue: 0.95)
        static let brandGradientEnd = Color(red: 0.99, green: 0.35, blue: 0.58)

        static let background = Color(uiColor: .systemBackground)
        static let secondaryBackground = Color(uiColor: .secondarySystemBackground)
        static let tertiaryBackground = Color(uiColor: .tertiarySystemBackground)

        static let textPrimary = Color(uiColor: .label)
        static let textSecondary = Color(uiColor: .secondaryLabel)
        static let textTertiary = Color(uiColor: .tertiaryLabel)

        static let success = Color(red: 0.20, green: 0.78, blue: 0.45)
        static let warning = Color(red: 0.98, green: 0.70, blue: 0.13)
        static let danger = Color(red: 0.96, green: 0.30, blue: 0.34)

        static let glassStroke = Color.white.opacity(0.18)
        static let glassHighlight = Color.white.opacity(0.35)
    }

    // MARK: - Gradients

    enum Gradients {
        static let brand = LinearGradient(
            colors: [Colors.brandGradientStart, Colors.brandGradientMid, Colors.brandGradientEnd],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let brandVertical = LinearGradient(
            colors: [Colors.brandGradientStart, Colors.brandGradientEnd],
            startPoint: .top,
            endPoint: .bottom
        )

        static func glassOverlay(colorScheme: ColorScheme) -> LinearGradient {
            let top = colorScheme == .dark ? Color.white.opacity(0.10) : Color.white.opacity(0.55)
            let bottom = colorScheme == .dark ? Color.white.opacity(0.02) : Color.white.opacity(0.10)
            return LinearGradient(colors: [top, bottom], startPoint: .top, endPoint: .bottom)
        }
    }

    // MARK: - Metrics

    enum Radius {
        static let small: CGFloat = 10
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
        static let extraLarge: CGFloat = 32
        static let pill: CGFloat = 999
    }

    enum Spacing {
        static let xxSmall: CGFloat = 4
        static let xSmall: CGFloat = 8
        static let small: CGFloat = 12
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
        static let xLarge: CGFloat = 32
        static let xxLarge: CGFloat = 48
    }

    enum Shadow {
        static let soft = Color.black.opacity(0.10)
        static let medium = Color.black.opacity(0.18)
    }

    enum Animation {
        static let quick = SwiftUI.Animation.easeOut(duration: 0.2)
        static let standard = SwiftUI.Animation.spring(response: 0.4, dampingFraction: 0.85)
        static let bouncy = SwiftUI.Animation.spring(response: 0.5, dampingFraction: 0.68)
        static let smoothLong = SwiftUI.Animation.easeInOut(duration: 0.6)
    }
}
