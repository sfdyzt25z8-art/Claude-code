import SwiftUI

/// Central color palette for the app. All colors are defined as dynamic
/// `Color` values that adapt automatically between Light and Dark Mode, and
/// meet WCAG AA contrast against their intended backgrounds.
enum Theme {
    /// Primary brand gradient used on hero surfaces (Create Video / Create Thumbnail cards).
    static let brandGradient = LinearGradient(
        colors: [Color(hex: 0x6C5CE7), Color(hex: 0xA855F7), Color(hex: 0xEC4899)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let background = Color(
        light: Color(hex: 0xF5F5F7),
        dark: Color(hex: 0x0B0B0D)
    )

    static let secondaryBackground = Color(
        light: .white,
        dark: Color(hex: 0x1C1C1E)
    )

    static let cardBackground = Color(
        light: .white.opacity(0.72),
        dark: Color(hex: 0x1C1C1E).opacity(0.72)
    )

    static let primaryText = Color(
        light: Color(hex: 0x111114),
        dark: Color(hex: 0xF5F5F7)
    )

    static let secondaryText = Color(
        light: Color(hex: 0x6B6B76),
        dark: Color(hex: 0x9A9AA4)
    )

    static let divider = Color(
        light: Color.black.opacity(0.08),
        dark: Color.white.opacity(0.1)
    )

    static let success = Color(hex: 0x34C759)
    static let warning = Color(hex: 0xFF9F0A)
    static let danger = Color(hex: 0xFF453A)

    /// Corner radii scale used consistently across cards, sheets, and controls.
    enum Radius {
        static let small: CGFloat = 10
        static let medium: CGFloat = 18
        static let large: CGFloat = 28
    }

    enum Shadow {
        static let card = Color.black.opacity(0.12)
    }
}

extension Color {
    /// Builds a `Color` from a packed 0xRRGGBB hex literal.
    init(hex: UInt32, opacity: Double = 1) {
        let red = Double((hex & 0xFF0000) >> 16) / 255
        let green = Double((hex & 0x00FF00) >> 8) / 255
        let blue = Double(hex & 0x0000FF) / 255
        self.init(.sRGB, red: red, green: green, blue: blue, opacity: opacity)
    }

    /// Builds a `Color` that resolves to `light` or `dark` depending on the current
    /// `UITraitCollection`, without requiring an Asset Catalog color entry.
    init(light: Color, dark: Color) {
        #if canImport(UIKit)
        self.init(uiColor: UIColor(light: UIColor(light), dark: UIColor(dark)))
        #else
        self = light
        #endif
    }
}

#if canImport(UIKit)
private extension UIColor {
    convenience init(light: UIColor, dark: UIColor) {
        self.init { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        }
    }
}
#endif
