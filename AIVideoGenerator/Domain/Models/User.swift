import Foundation

struct User: Identifiable, Codable, Sendable, Equatable {
    enum AuthProvider: String, Codable, Sendable, Hashable {
        case apple, google, email
    }

    let id: UUID
    var email: String
    var displayName: String
    var authProvider: AuthProvider
    var avatarURL: URL?
    var subscription: SubscriptionPlan
    var createdAt: Date

    init(
        id: UUID = UUID(),
        email: String,
        displayName: String,
        authProvider: AuthProvider,
        avatarURL: URL? = nil,
        subscription: SubscriptionPlan = .free,
        createdAt: Date = .now
    ) {
        self.id = id
        self.email = email
        self.displayName = displayName
        self.authProvider = authProvider
        self.avatarURL = avatarURL
        self.subscription = subscription
        self.createdAt = createdAt
    }
}

/// Subscription tiers gate generation limits, resolution caps, and provider
/// access. Limits are illustrative defaults — the backend is the source of
/// truth and can reconfigure these per account without an app update.
enum SubscriptionPlan: String, CaseIterable, Identifiable, Codable, Sendable, Hashable {
    case free, plus, pro, studio

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .free: "Free"
        case .plus: "Plus"
        case .pro: "Pro"
        case .studio: "Studio"
        }
    }

    /// Monthly generation credits. The backend can override this at any time;
    /// this value is only a local fallback for UI estimation before the
    /// account entitlement response arrives.
    var monthlyCreditsFallback: Int {
        switch self {
        case .free: 10
        case .plus: 100
        case .pro: 500
        case .studio: 2000
        }
    }

    var maxResolutionFallback: VideoResolution {
        switch self {
        case .free: .r720p
        case .plus: .r1080p
        case .pro: .r1440p
        case .studio: .r4K
        }
    }

    var allowsLongFormStitching: Bool {
        switch self {
        case .free: false
        case .plus, .pro, .studio: true
        }
    }
}

/// Live entitlement snapshot fetched from the backend, distinct from the
/// static `SubscriptionPlan` metadata above. The app must never assume
/// unlimited generation — all limits are authoritative from this struct.
struct AccountEntitlements: Codable, Sendable, Equatable {
    var plan: SubscriptionPlan
    var creditsRemaining: Int
    var creditsResetAt: Date
    var maxResolution: VideoResolution
    var maxDurationSeconds: TimeInterval
    var canUseVoiceCloning: Bool
    var storageUsedBytes: Int64
    var storageQuotaBytes: Int64
}
