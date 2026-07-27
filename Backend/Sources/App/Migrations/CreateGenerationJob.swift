import Fluent

struct CreateGenerationJob: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("generation_jobs")
            .id()
            .field("user_id", .uuid, .required, .references("users", "id"))
            .field("kind", .string, .required)
            .field("title", .string, .required)
            .field("status", .string, .required)
            .field("progress", .double, .required)
            .field("provider_id", .string)
            .field("result_asset_url", .string)
            .field("error_message", .string)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("generation_jobs").delete()
    }
}
