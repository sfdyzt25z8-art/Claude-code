import Foundation

/// The signed-in user's profile. Never stores raw credentials — those live in the
/// Keychain (see `KeychainStore`) or with the identity provider.
struct User: Identifiable, Codable, Equatable, Sendable {
    let id: UUID
    var displayName: String
    var email: String?
    var authProvider: AuthProvider
    var subscription: SubscriptionPlan
    var createdAt: Date

    enum AuthProvider: String, Codable, Sendable {
        case apple, google, email
    }
}

/// Subscription tiers gate generation limits, resolution ceilings, and available
/// providers. The client never hardcodes "unlimited" — limits are always read from
/// the backend-configured plan so pricing/limits can change without an app update.
struct SubscriptionPlan: Codable, Equatable, Sendable {
    var tier: Tier
    var maxResolution: VideoResolution
    var monthlyGenerationCredits: Int
    var usedGenerationCredits: Int
    var maxConcurrentJobs: Int
    var cloudSyncEnabled: Bool

    enum Tier: String, Codable, Sendable {
        case free, pro, studio
    }

    var remainingCredits: Int {
        max(monthlyGenerationCredits - usedGenerationCredits, 0)
    }

    var hasRemainingCredits: Bool { remainingCredits > 0 }

    static let free = SubscriptionPlan(
        tier: .free,
        maxResolution: .p1080,
        monthlyGenerationCredits: 10,
        usedGenerationCredits: 0,
        maxConcurrentJobs: 1,
        cloudSyncEnabled: false
    )
}
