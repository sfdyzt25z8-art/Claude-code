import SwiftUI

extension View {
    /// Applies a card-style shadow consistent with the app's elevation system.
    func cardShadow(elevated: Bool = false) -> some View {
        shadow(
            color: elevated ? Theme.Shadow.medium : Theme.Shadow.soft,
            radius: elevated ? 20 : 10,
            x: 0,
            y: elevated ? 12 : 6
        )
    }

    /// Conditionally applies a transform, useful for platform- or state-dependent modifiers.
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }

    /// Rounds specific corners only.
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCornerShape(radius: radius, corners: corners))
    }

    /// Shorthand for hiding a view while preserving layout space.
    func hidden(_ isHidden: Bool) -> some View {
        opacity(isHidden ? 0 : 1)
    }
}

struct RoundedCornerShape: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
