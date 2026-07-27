import SwiftUI

/// Settings screen covering appearance, generation defaults, AI provider
/// selection, notifications, and account/session management, plus links to the
/// Privacy Policy and Terms of Service required for App Store compliance.
struct SettingsView: View {
    @Environment(DependencyContainer.self) private var container
    @State private var viewModel: SettingsViewModel?
    @State private var showingSignOutConfirmation = false

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    List {
                        accountSection(viewModel: viewModel)
                        appearanceSection(viewModel: viewModel)
                        defaultsSection(viewModel: viewModel)
                        providerSection(viewModel: viewModel)
                        notificationsSection(viewModel: viewModel)
                        legalSection
                    }
                } else {
                    ProgressView()
                }
            }
            .navigationTitle("Settings")
            .task {
                if viewModel == nil {
                    viewModel = SettingsViewModel(
                        authService: container.authService,
                        availableProviders: container.providerRegistry.allVideoProviders()
                    )
                }
            }
        }
    }

    @ViewBuilder
    private func accountSection(viewModel: SettingsViewModel) -> some View {
        Section("Account") {
            if let user = viewModel.currentUser {
                LabeledContent("Name", value: user.displayName)
                if let email = user.email {
                    LabeledContent("Email", value: email)
                }
                LabeledContent("Plan", value: user.subscription.tier.rawValue.capitalized)
                Button("Sign Out", role: .destructive) {
                    showingSignOutConfirmation = true
                }
                .confirmationDialog("Sign out of AI Video Generator?", isPresented: $showingSignOutConfirmation) {
                    Button("Sign Out", role: .destructive) {
                        Task { await viewModel.signOut() }
                    }
                }
            }
        }
    }

    private func appearanceSection(viewModel: SettingsViewModel) -> some View {
        Section("Appearance") {
            Picker("Theme", selection: Binding(get: { viewModel.theme }, set: { viewModel.theme = $0 })) {
                ForEach(SettingsViewModel.AppTheme.allCases) { theme in
                    Text(theme.displayName).tag(theme)
                }
            }
        }
    }

    private func defaultsSection(viewModel: SettingsViewModel) -> some View {
        Section("Generation Defaults") {
            Picker("Default Resolution", selection: Binding(get: { viewModel.defaultResolution }, set: { viewModel.defaultResolution = $0 })) {
                ForEach(VideoResolution.allCases) { resolution in
                    Text(resolution.rawValue).tag(resolution)
                }
            }
            Picker("Default Frame Rate", selection: Binding(get: { viewModel.defaultFrameRate }, set: { viewModel.defaultFrameRate = $0 })) {
                ForEach(FrameRate.allCases) { frameRate in
                    Text(frameRate.displayName).tag(frameRate)
                }
            }
        }
    }

    private func providerSection(viewModel: SettingsViewModel) -> some View {
        Section("AI Provider") {
            Picker("Provider", selection: Binding(get: { viewModel.selectedProviderID }, set: { viewModel.selectedProviderID = $0 })) {
                ForEach(viewModel.availableProviders, id: \.id) { provider in
                    Text(provider.displayName).tag(provider.id)
                }
            }
        }
    }

    private func notificationsSection(viewModel: SettingsViewModel) -> some View {
        Section("Notifications") {
            Toggle("Generation Complete Alerts", isOn: Binding(get: { viewModel.notificationsEnabled }, set: { viewModel.notificationsEnabled = $0 }))
        }
    }

    private var legalSection: some View {
        Section("Legal") {
            NavigationLink("Privacy Policy") {
                LegalDocumentView(title: "Privacy Policy", markdownFileName: "PrivacyPolicy")
            }
            NavigationLink("Terms of Service") {
                LegalDocumentView(title: "Terms of Service", markdownFileName: "TermsOfService")
            }
            NavigationLink("Report Content") {
                ReportContentView()
            }
        }
    }
}

#Preview {
    SettingsView()
        .environment(DependencyContainer.preview())
}
