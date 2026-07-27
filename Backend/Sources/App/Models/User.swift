import Fluent
import Vapor

/// Mirrors the client's `User`/`SubscriptionPlan` models
/// (`AIVideoGenerator/Sources/AIVideoGenerator/Core/Models/User.swift`) —
/// subscription limits live here, on the server, so the client never
/// hardcodes "unlimited" generation.
final class User: Model, Content, @unchecked Sendable {
    static let schema = "users"

    @ID(key: .id) var id: UUID?
    @Field(key: "display_name") var displayName: String
    @Field(key: "email") var email: String
    @Field(key: "password_hash") var passwordHash: String
    @Field(key: "auth_provider") var authProvider: String
    @Field(key: "subscription_tier") var subscriptionTier: String
    @Field(key: "max_resolution") var maxResolution: String
    @Field(key: "monthly_generation_credits") var monthlyGenerationCredits: Int
    @Field(key: "used_generation_credits") var usedGenerationCredits: Int
    @Timestamp(key: "created_at", on: .create) var createdAt: Date?

    init() {}

    init(
        id: UUID? = nil,
        displayName: String,
        email: String,
        passwordHash: String,
        authProvider: String,
        subscriptionTier: String = "free",
        maxResolution: String = "1080p",
        monthlyGenerationCredits: Int = 10,
        usedGenerationCredits: Int = 0
    ) {
        self.id = id
        self.displayName = displayName
        self.email = email
        self.passwordHash = passwordHash
        self.authProvider = authProvider
        self.subscriptionTier = subscriptionTier
        self.maxResolution = maxResolution
        self.monthlyGenerationCredits = monthlyGenerationCredits
        self.usedGenerationCredits = usedGenerationCredits
    }
}

extension User: ModelAuthenticatable {
    static let usernameKey = \User.$email
    static let passwordHashKey = \User.$passwordHash

    func verify(password: String) throws -> Bool {
        try Bcrypt.verify(password, created: self.passwordHash)
    }
}

/// Public, client-facing representation — never serializes `passwordHash`.
struct UserDTO: Content {
    let id: UUID
    let displayName: String
    let email: String
    let authProvider: String
    let subscription: SubscriptionDTO

    struct SubscriptionDTO: Content {
        let tier: String
        let maxResolution: String
        let monthlyGenerationCredits: Int
        let usedGenerationCredits: Int
    }
}

extension User {
    func asPublicDTO() throws -> UserDTO {
        UserDTO(
            id: try requireID(),
            displayName: displayName,
            email: email,
            authProvider: authProvider,
            subscription: .init(
                tier: subscriptionTier,
                maxResolution: maxResolution,
                monthlyGenerationCredits: monthlyGenerationCredits,
                usedGenerationCredits: usedGenerationCredits
            )
        )
    }
}
