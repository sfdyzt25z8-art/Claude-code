import SwiftUI

/// The app's top-level view: shows `SignInView` when signed out, otherwise a
/// tab-based shell (Home, Projects, Settings) that adapts its layout for iPad
/// via `NavigationSplitView` and for iPhone via a bottom `TabView`.
struct RootView: View {
    @Environment(DependencyContainer.self) private var container
    @State private var isRestoringSession = true
    @State private var isSignedIn = false

    var body: some View {
        Group {
            if isRestoringSession {
                SplashView()
            } else if isSignedIn {
                MainTabView()
            } else {
                SignInView(onSignedIn: { isSignedIn = true })
            }
        }
        .task {
            await container.authService.restoreSession()
            isSignedIn = container.authService.currentUser != nil
            isRestoringSession = false
        }
    }
}

private struct SplashView: View {
    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(spacing: Spacing.md) {
                Image(systemName: "sparkles.tv.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(Theme.brandGradient)
                Text("AI Video Generator")
                    .font(Typography.title)
                    .foregroundStyle(Theme.primaryText)
            }
        }
    }
}

private struct MainTabView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selectedSection: AppSection? = .home

    private enum AppSection: String, Identifiable, Hashable, CaseIterable {
        case home, projects, settings
        var id: String { rawValue }

        var title: String {
            switch self {
            case .home: return "Home"
            case .projects: return "Projects"
            case .settings: return "Settings"
            }
        }

        var symbolName: String {
            switch self {
            case .home: return "house.fill"
            case .projects: return "folder.fill"
            case .settings: return "gearshape.fill"
            }
        }
    }

    var body: some View {
        if horizontalSizeClass == .regular {
            NavigationSplitView {
                List(AppSection.allCases, selection: $selectedSection) { section in
                    Label(section.title, systemImage: section.symbolName)
                        .tag(section)
                }
                .navigationTitle("AI Video Generator")
            } detail: {
                detailView(for: selectedSection ?? .home)
            }
        } else {
            TabView {
                HomeView()
                    .tabItem { Label("Home", systemImage: "house.fill") }

                ProjectsView()
                    .tabItem { Label("Projects", systemImage: "folder.fill") }

                SettingsView()
                    .tabItem { Label("Settings", systemImage: "gearshape.fill") }
            }
            .tint(Color(hex: 0x6C5CE7))
        }
    }

    @ViewBuilder
    private func detailView(for section: AppSection) -> some View {
        switch section {
        case .home: HomeView()
        case .projects: ProjectsView()
        case .settings: SettingsView()
        }
    }
}

#Preview {
    RootView()
        .environment(DependencyContainer.preview())
}
