import Foundation
import Observation

/// Backs the Settings screen: theme, language, default generation options,
/// AI provider selection, notifications, and account actions. Preferences are
/// persisted via `UserDefaults`; anything security-sensitive (tokens) stays in
/// the Keychain via `AuthServiceProviding` and is never surfaced here directly.
@MainActor
@Observable
final class SettingsViewModel {
    enum AppTheme: String, CaseIterable, Identifiable {
        case system, light, dark
        var id: String { rawValue }
        var displayName: String { rawValue.capitalized }
    }

    var theme: AppTheme {
        didSet { defaults.set(theme.rawValue, forKey: Keys.theme) }
    }
    var defaultResolution: VideoResolution {
        didSet { defaults.set(defaultResolution.rawValue, forKey: Keys.defaultResolution) }
    }
    var defaultFrameRate: FrameRate {
        didSet { defaults.set(defaultFrameRate.rawValue, forKey: Keys.defaultFrameRate) }
    }
    var notificationsEnabled: Bool {
        didSet { defaults.set(notificationsEnabled, forKey: Keys.notifications) }
    }
    var selectedProviderID: String {
        didSet { defaults.set(selectedProviderID, forKey: Keys.provider) }
    }

    let availableProviders: [AIVideoProviding]
    let authService: AuthServiceProviding
    private let defaults: UserDefaults

    private enum Keys {
        static let theme = "settings.theme"
        static let defaultResolution = "settings.defaultResolution"
        static let defaultFrameRate = "settings.defaultFrameRate"
        static let notifications = "settings.notifications"
        static let provider = "settings.provider"
    }

    init(authService: AuthServiceProviding, availableProviders: [AIVideoProviding], defaults: UserDefaults = .standard) {
        self.authService = authService
        self.availableProviders = availableProviders
        self.defaults = defaults

        theme = AppTheme(rawValue: defaults.string(forKey: Keys.theme) ?? "") ?? .system
        defaultResolution = VideoResolution(rawValue: defaults.string(forKey: Keys.defaultResolution) ?? "") ?? .p1080
        defaultFrameRate = FrameRate(rawValue: defaults.integer(forKey: Keys.defaultFrameRate)) ?? .fps30
        notificationsEnabled = defaults.object(forKey: Keys.notifications) as? Bool ?? true
        selectedProviderID = defaults.string(forKey: Keys.provider) ?? availableProviders.first?.id ?? "mock.studio"
    }

    var currentUser: User? { authService.currentUser }

    func signOut() async {
        await authService.signOut()
    }
}
