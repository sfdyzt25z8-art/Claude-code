import SwiftUI

/// Full-screen blocking overlay used sparingly for irreversible or
/// short-lived operations (e.g. submitting a generation job).
struct LoadingOverlay: View {
    var message: String = "Loading…"

    var body: some View {
        ZStack {
            Color.black.opacity(0.25).ignoresSafeArea()
            VStack(spacing: Theme.Spacing.small) {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(.white)
                    .scaleEffect(1.2)
                Text(message)
                    .font(.AIVG.subheadline)
                    .foregroundStyle(.white)
            }
            .padding(Theme.Spacing.large)
            .background(GlassBackground(cornerRadius: Theme.Radius.large, material: .thinMaterial))
        }
        .transition(.opacity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(message)
    }
}
