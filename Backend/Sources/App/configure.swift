import Vapor
import Fluent
import FluentSQLiteDriver
import JWT

public func configure(_ app: Application) async throws {
    if app.environment == .testing {
        app.databases.use(.sqlite(.memory), as: .sqlite)
    } else {
        app.databases.use(.sqlite(.file("db.sqlite")), as: .sqlite)
    }

    app.migrations.add(CreateUser())
    app.migrations.add(CreateGenerationJob())

    // The client's JSON coders (`Endpoint.swift`) use `.convertToSnakeCase` /
    // `.convertFromSnakeCase` + ISO 8601 dates — match that here so payloads
    // decode without every DTO needing manual CodingKeys.
    let encoder = JSONEncoder()
    encoder.keyEncodingStrategy = .convertToSnakeCase
    encoder.dateEncodingStrategy = .iso8601
    ContentConfiguration.global.use(encoder: encoder, for: .json)

    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    decoder.dateDecodingStrategy = .iso8601
    ContentConfiguration.global.use(decoder: decoder, for: .json)

    let jwtSecret = Environment.get("JWT_SECRET") ?? {
        app.logger.warning("JWT_SECRET is not set — using an insecure development default. Set JWT_SECRET before deploying.")
        return "dev-secret-change-me-before-deploying"
    }()
    app.jwt.signers.use(.hs256(key: jwtSecret))

    app.middleware.use(RateLimitMiddleware(store: RateLimiterStore()))

    try routes(app)

    try await app.autoMigrate()
}
