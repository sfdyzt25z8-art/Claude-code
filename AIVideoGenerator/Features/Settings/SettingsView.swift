import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel: SettingsViewModel
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var providerRegistry: ProviderRegistry
    @State private var showingSignOutConfirmation = false

    init(viewModel: SettingsViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            AuroraBackground()
            List {
                accountSection
                appearanceSection
                defaultsSection
                aiProviderSection
                storageSection
                notificationsPrivacySection
                aboutSection
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Settings")
        .task { await viewModel.load() }
        .confirmationDialog("Sign out of AI Video Generator?", isPresented: $showingSignOutConfirmation, titleVisibility: .visible) {
            Button("Sign Out", role: .destructive) {
                Task { await viewModel.signOut() }
            }
        }
    }

    private var accountSection: some View {
        Section("Account") {
            if let user = viewModel.currentUser {
                HStack {
                    Circle()
                        .fill(Theme.Gradients.brand)
                        .frame(width: 44, height: 44)
                        .overlay(Text(String(user.displayName.prefix(1))).foregroundStyle(.white).font(.AIVG.headline))
                    VStack(alignment: .leading) {
                        Text(user.displayName).font(.AIVG.bodyEmphasized)
                        Text(user.email).font(.AIVG.footnote).foregroundStyle(Theme.Colors.textSecondary)
                    }
                    Spacer()
                    Text(user.subscription.displayName)
                        .font(.AIVG.caption)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Theme.Gradients.brand, in: Capsule())
                        .foregroundStyle(.white)
                }
            }
            Button("Sign Out", role: .destructive) {
                showingSignOutConfirmation = true
            }
        }
        .listRowBackground(Color.clear.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: Theme.Radius.medium)))
    }

    private var appearanceSection: some View {
        Section("Appearance") {
            Picker("Theme", selection: $appState.theme) {
                ForEach(AppTheme.allCases) { theme in
                    Text(theme.displayName).tag(theme)
                }
            }
            Picker("Language", selection: $appState.preferredLanguageCode) {
                Text("English").tag("en")
                Text("Spanish").tag("es")
                Text("French").tag("fr")
                Text("German").tag("de")
                Text("Japanese").tag("ja")
            }
        }
    }

    private var defaultsSection: some View {
        Section("Generation Defaults") {
            Picker("Default Resolution", selection: Binding(
                get: { appState.defaultResolution },
                set: { appState.defaultResolution = $0 }
            )) {
                ForEach(VideoResolution.allCases) { Text($0.displayName).tag($0) }
            }
            Picker("Default Frame Rate", selection: Binding(
                get: { appState.defaultFrameRate },
                set: { appState.defaultFrameRate = $0 }
            )) {
                ForEach(VideoFrameRate.allCases) { Text($0.displayName).tag($0) }
            }
        }
    }

    private var aiProviderSection: some View {
        Section("AI Provider Selection") {
            Picker("Video Generation", selection: $providerRegistry.selectedVideoProviderID) {
                ForEach(providerRegistry.videoProviders, id: \.id) { provider in
                    Text(provider.displayName).tag(provider.id)
                }
            }
            Picker("Thumbnail Generation", selection: $providerRegistry.selectedThumbnailProviderID) {
                ForEach(providerRegistry.thumbnailProviders, id: \.id) { provider in
                    Text(provider.displayName).tag(provider.id)
                }
            }
            Picker("Prompt Assistant", selection: $providerRegistry.selectedPromptAssistProviderID) {
                ForEach(providerRegistry.promptAssistProviders, id: \.id) { provider in
                    Text(provider.displayName).tag(provider.id)
                }
            }
        }
    }

    private var storageSection: some View {
        Section("Storage") {
            VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                ProgressView(value: viewModel.storageUsage.fraction)
                    .tint(Theme.Colors.accentPrimary)
                Text("\(viewModel.storageUsage.formattedUsed) of \(viewModel.storageUsage.formattedQuota) used")
                    .font(.AIVG.footnote)
                    .foregroundStyle(Theme.Colors.textSecondary)
            }
        }
    }

    private var notificationsPrivacySection: some View {
        Section("Notifications & Privacy") {
            Toggle("Push Notifications", isOn: $appState.notificationsEnabled)
            NavigationLink("Privacy Policy") {
                LegalDocumentView(title: "Privacy Policy", markdown: LegalDocuments.privacyPolicy)
            }
            NavigationLink("Terms of Service") {
                LegalDocumentView(title: "Terms of Service", markdown: LegalDocuments.termsOfService)
            }
            NavigationLink("Report a Problem") {
                ReportIssueView()
            }
        }
    }

    private var aboutSection: some View {
        Section("About") {
            HStack {
                Text("Version")
                Spacer()
                Text(Bundle.main.appVersionDisplay)
                    .foregroundStyle(Theme.Colors.textSecondary)
            }
        }
    }
}

extension Bundle {
    var appVersionDisplay: String {
        let version = infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let build = infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }
}
