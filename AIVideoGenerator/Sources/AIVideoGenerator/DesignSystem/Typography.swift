import SwiftUI

/// Semantic type scale built on Dynamic Type text styles so every screen
/// scales correctly with the user's accessibility text size settings.
enum Typography {
    static let largeTitle = Font.system(.largeTitle, design: .rounded, weight: .bold)
    static let title = Font.system(.title2, design: .rounded, weight: .bold)
    static let headline = Font.system(.headline, design: .rounded, weight: .semibold)
    static let body = Font.system(.body, design: .default, weight: .regular)
    static let subheadline = Font.system(.subheadline, design: .default, weight: .medium)
    static let caption = Font.system(.caption, design: .default, weight: .medium)
    static let button = Font.system(.headline, design: .rounded, weight: .semibold)
}

/// Consistent spacing scale used for padding and stack spacing across the app.
enum Spacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}
