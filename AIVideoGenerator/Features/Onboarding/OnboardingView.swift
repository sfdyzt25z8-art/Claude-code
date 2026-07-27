import SwiftUI

struct OnboardingPage: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let systemImage: String
}

struct OnboardingView: View {
    let onFinish: () -> Void

    @State private var selection = 0

    private let pages: [OnboardingPage] = [
        OnboardingPage(title: "Generate Stunning AI Video", subtitle: "Turn a single sentence into a cinematic video — any style, any length up to 90 minutes.", systemImage: "sparkles.tv"),
        OnboardingPage(title: "Full Creative Control", subtitle: "Camera moves, lighting, effects, sound, and subtitles — tuned by AI or by you.", systemImage: "slider.horizontal.3"),
        OnboardingPage(title: "Edit & Export Anywhere", subtitle: "Trim, grade, and export in 4K, then share directly to your favorite apps.", systemImage: "square.and.arrow.up.on.square")
    ]

    var body: some View {
        ZStack {
            AuroraBackground()

            VStack {
                TabView(selection: $selection) {
                    ForEach(Array(pages.enumerated()), id: \.element.id) { index, page in
                        VStack(spacing: Theme.Spacing.large) {
                            Spacer()
                            Image(systemName: page.systemImage)
                                .font(.system(size: 72))
                                .foregroundStyle(Theme.Gradients.brand)
                            Text(page.title)
                                .font(.AIVG.title)
                                .multilineTextAlignment(.center)
                            Text(page.subtitle)
                                .font(.AIVG.body)
                                .foregroundStyle(Theme.Colors.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, Theme.Spacing.xLarge)
                            Spacer()
                            Spacer()
                        }
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))

                PrimaryButton(title: selection == pages.count - 1 ? "Get Started" : "Next") {
                    if selection == pages.count - 1 {
                        onFinish()
                    } else {
                        withAnimation { selection += 1 }
                    }
                }
                .padding(.horizontal, Theme.Spacing.large)
                .padding(.bottom, Theme.Spacing.large)

                Button("Skip", action: onFinish)
                    .font(.AIVG.subheadline)
                    .padding(.bottom, Theme.Spacing.medium)
            }
        }
    }
}
