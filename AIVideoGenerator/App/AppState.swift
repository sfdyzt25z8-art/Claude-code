import SwiftUI

enum AppTheme: String, CaseIterable, Identifiable, Codable, Hashable {
    case system, light, dark

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

/// App-wide, user-facing preferences that outlive a single screen and are
/// persisted to `UserDefaults` (non-sensitive settings only — secrets live
/// in Keychain via `AuthTokenStore`).
///
/// Properties are `@Published` (rather than `@AppStorage`) so that every
/// view observing `AppState` via `@EnvironmentObject` reliably re-renders on
/// change — `@AppStorage` is designed for direct use inside a `View` and
/// does not forward `objectWillChange` when embedded in a plain
/// `ObservableObject` class.
@MainActor
final class AppState: ObservableObject {
    @Published var theme: AppTheme { didSet { defaults.set(theme.rawValue, forKey: Keys.theme) } }
    @Published var defaultResolution: VideoResolution { didSet { defaults.set(defaultResolution.rawValue, forKey: Keys.defaultResolution) } }
    @Published var defaultFrameRate: VideoFrameRate { didSet { defaults.set(defaultFrameRate.rawValue, forKey: Keys.defaultFrameRate) } }
    @Published var notificationsEnabled: Bool { didSet { defaults.set(notificationsEnabled, forKey: Keys.notificationsEnabled) } }
    @Published var hasCompletedOnboarding: Bool { didSet { defaults.set(hasCompletedOnboarding, forKey: Keys.hasCompletedOnboarding) } }
    @Published var preferredLanguageCode: String { didSet { defaults.set(preferredLanguageCode, forKey: Keys.preferredLanguageCode) } }

    @Published var isSignedIn: Bool = false
    @Published var currentUser: User?

    private let defaults: UserDefaults

    private enum Keys {
        static let theme = "appTheme"
        static let defaultResolution = "defaultResolution"
        static let defaultFrameRate = "defaultFrameRate"
        static let notificationsEnabled = "notificationsEnabled"
        static let hasCompletedOnboarding = "hasCompletedOnboarding"
        static let preferredLanguageCode = "preferredLanguageCode"
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.theme = defaults.string(forKey: Keys.theme).flatMap(AppTheme.init(rawValue:)) ?? .system
        self.defaultResolution = defaults.string(forKey: Keys.defaultResolution).flatMap(VideoResolution.init(rawValue:)) ?? .r1080p
        let storedFrameRate = defaults.object(forKey: Keys.defaultFrameRate) as? Int
        self.defaultFrameRate = storedFrameRate.flatMap(VideoFrameRate.init(rawValue:)) ?? .fps30
        self.notificationsEnabled = defaults.object(forKey: Keys.notificationsEnabled) as? Bool ?? true
        self.hasCompletedOnboarding = defaults.bool(forKey: Keys.hasCompletedOnboarding)
        self.preferredLanguageCode = defaults.string(forKey: Keys.preferredLanguageCode) ?? Locale.current.language.languageCode?.identifier ?? "en"
    }
}
