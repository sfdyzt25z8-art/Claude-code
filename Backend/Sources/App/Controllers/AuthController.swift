import Vapor
import Fluent

struct SignUpRequest: Content {
    let email: String
    let password: String
    let displayName: String
}

struct SignInRequest: Content {
    let email: String
    let password: String
}

struct ResetPasswordRequest: Content {
    let email: String
}

struct AuthResponse: Content {
    let token: String
    let user: UserDTO
}

/// Email/password auth, matching `AuthServiceProviding` on the client. Sign
/// in with Apple and Google aren't implemented here yet — those need real
/// token verification against Apple's/Google's identity services, which in
/// turn needs this app registered with both, something only the app's owner
/// can do. See docs/ARCHITECTURE.md.
struct AuthController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let auth = routes.grouped("v1", "auth")
        auth.post("signup", use: signUp)
        auth.post("signin", use: signIn)
        auth.post("reset-password", use: resetPassword)
    }

    func signUp(req: Request) async throws -> AuthResponse {
        let payload = try req.content.decode(SignUpRequest.self)
        guard payload.password.count >= 8 else {
            throw Abort(.badRequest, reason: "Password must be at least 8 characters.")
        }
        guard try await User.query(on: req.db).filter(\.$email == payload.email).first() == nil else {
            throw Abort(.conflict, reason: "An account with this email already exists.")
        }

        let user = User(
            displayName: payload.displayName,
            email: payload.email,
            passwordHash: try Bcrypt.hash(payload.password),
            authProvider: "email"
        )
        try await user.save(on: req.db)

        return AuthResponse(token: try makeToken(for: user, req: req), user: try user.asPublicDTO())
    }

    func signIn(req: Request) async throws -> AuthResponse {
        let payload = try req.content.decode(SignInRequest.self)
        guard
            let user = try await User.query(on: req.db).filter(\.$email == payload.email).first(),
            try user.verify(password: payload.password)
        else {
            throw Abort(.unauthorized, reason: "Invalid email or password.")
        }

        return AuthResponse(token: try makeToken(for: user, req: req), user: try user.asPublicDTO())
    }

    func resetPassword(req: Request) async throws -> HTTPStatus {
        _ = try req.content.decode(ResetPasswordRequest.self)
        // A real implementation enqueues a signed, time-limited reset link via a
        // transactional email provider. Neither is wired up in this build.
        return .ok
    }

    private func makeToken(for user: User, req: Request) throws -> String {
        let payload = UserPayload(
            subject: SubjectClaim(value: try user.requireID().uuidString),
            expiration: .init(value: Date().addingTimeInterval(60 * 60 * 24 * 30))
        )
        return try req.jwt.sign(payload)
    }
}
