import SwiftUI

@main
struct AIVideoGeneratorApp: App {
    @StateObject private var environment = AppEnvironment()
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(environment)
                .environmentObject(environment.providerRegistry)
                .environmentObject(environment.jobQueue)
                .environmentObject(environment.promptAssistant)
                .environmentObject(environment.mockAuthService)
                .environmentObject(appState)
                .preferredColorScheme(appState.theme.colorScheme)
                .tint(Theme.Colors.accentPrimary)
        }
    }
}
