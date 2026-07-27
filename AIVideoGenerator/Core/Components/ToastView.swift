import SwiftUI

struct Toast: Equatable {
    enum Style: Equatable {
        case success, error, info

        var color: Color {
            switch self {
            case .success: Theme.Colors.success
            case .error: Theme.Colors.danger
            case .info: Theme.Colors.accentPrimary
            }
        }

        var icon: String {
            switch self {
            case .success: "checkmark.circle.fill"
            case .error: "exclamationmark.triangle.fill"
            case .info: "info.circle.fill"
            }
        }
    }

    let message: String
    var style: Style = .info
}

/// Lightweight, auto-dismissing toast banner presented at the top of the screen.
struct ToastView: View {
    let toast: Toast

    var body: some View {
        HStack(spacing: Theme.Spacing.xSmall) {
            Image(systemName: toast.style.icon)
                .foregroundStyle(toast.style.color)
            Text(toast.message)
                .font(.AIVG.subheadline)
                .foregroundStyle(Theme.Colors.textPrimary)
                .lineLimit(2)
        }
        .padding(.horizontal, Theme.Spacing.medium)
        .padding(.vertical, Theme.Spacing.small)
        .glassCard(cornerRadius: Theme.Radius.pill, padding: 0)
        .padding(.horizontal, Theme.Spacing.large)
    }
}

/// View modifier that overlays a toast banner driven by an optional binding.
struct ToastModifier: ViewModifier {
    @Binding var toast: Toast?

    func body(content: Content) -> some View {
        content.overlay(alignment: .top) {
            if let toast {
                ToastView(toast: toast)
                    .padding(.top, Theme.Spacing.small)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .task(id: toast) {
                        try? await Task.sleep(for: .seconds(2.5))
                        withAnimation(Theme.Animation.standard) {
                            if self.toast == toast {
                                self.toast = nil
                            }
                        }
                    }
            }
        }
        .animation(Theme.Animation.standard, value: toast)
    }
}

extension View {
    func toast(_ toast: Binding<Toast?>) -> some View {
        modifier(ToastModifier(toast: toast))
    }
}
