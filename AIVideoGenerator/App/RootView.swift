import SwiftUI

/// Top-level flow controller: onboarding → authentication → main app.
struct RootView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var mockAuthService: MockAuthService
    @EnvironmentObject private var environment: AppEnvironment

    var body: some View {
        Group {
            if !appState.hasCompletedOnboarding {
                OnboardingView {
                    withAnimation(Theme.Animation.standard) {
                        appState.hasCompletedOnboarding = true
                    }
                }
            } else if mockAuthService.currentUser == nil {
                SignInView(viewModel: AuthViewModel(authService: mockAuthService))
            } else {
                MainTabView(environment: environment)
            }
        }
        .animation(Theme.Animation.standard, value: appState.hasCompletedOnboarding)
        .onChange(of: mockAuthService.currentUser) { _, newValue in
            appState.currentUser = newValue
            appState.isSignedIn = newValue != nil
        }
    }
}
