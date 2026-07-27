import SwiftUI

/// Root tab bar hosting the four primary destinations. Each tab owns its
/// own `NavigationStack` so deep pushes (e.g. Home → Video Generator →
/// Editor) don't interfere with the other tabs' navigation state.
struct MainTabView: View {
    enum Tab: Hashable {
        case home, projects, editor, settings
    }

    let environment: AppEnvironment
    @State private var selectedTab: Tab = .home

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                HomeView(
                    viewModel: HomeViewModel(
                        projectStore: environment.projectStore,
                        storageUsageService: environment.storageUsageService
                    ),
                    projectStore: environment.projectStore
                )
            }
            .tabItem { Label("Home", systemImage: "house.fill") }
            .tag(Tab.home)

            NavigationStack {
                ProjectsListView(
                    viewModel: ProjectsViewModel(projectStore: environment.projectStore),
                    projectStore: environment.projectStore
                )
            }
            .tabItem { Label("Projects", systemImage: "folder.fill") }
            .tag(Tab.projects)

            NavigationStack {
                VideoEditorView(project: nil)
            }
            .tabItem { Label("Editor", systemImage: "slider.horizontal.below.rectangle") }
            .tag(Tab.editor)

            NavigationStack {
                SettingsView(viewModel: SettingsViewModel(
                    storageUsageService: environment.storageUsageService,
                    authService: environment.mockAuthService
                ))
            }
            .tabItem { Label("Settings", systemImage: "gearshape.fill") }
            .tag(Tab.settings)
        }
    }
}
