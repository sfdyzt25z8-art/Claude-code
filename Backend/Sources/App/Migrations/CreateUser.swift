import Fluent

struct CreateUser: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("users")
            .id()
            .field("display_name", .string, .required)
            .field("email", .string, .required)
            .unique(on: "email")
            .field("password_hash", .string, .required)
            .field("auth_provider", .string, .required)
            .field("subscription_tier", .string, .required)
            .field("max_resolution", .string, .required)
            .field("monthly_generation_credits", .int, .required)
            .field("used_generation_credits", .int, .required)
            .field("created_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("users").delete()
    }
}
