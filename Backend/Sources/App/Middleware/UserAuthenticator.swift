import Vapor
import JWT
import Fluent

/// JWT claims issued at sign-in/sign-up. `subject` carries the user's UUID.
struct UserPayload: JWTPayload {
    var subject: SubjectClaim
    var expiration: ExpirationClaim

    func verify(using signer: JWTSigner) throws {
        try expiration.verifyNotExpired()
    }
}

/// Verifies the bearer token on every request in front of it, loads the
/// corresponding `User`, and logs it into `request.auth` — the real
/// authentication gate for every protected route below.
struct UserAuthenticator: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        guard let bearer = request.headers.bearerAuthorization else {
            throw Abort(.unauthorized, reason: "Missing bearer token.")
        }

        let payload: UserPayload
        do {
            payload = try request.jwt.verify(bearer.token, as: UserPayload.self)
        } catch {
            throw Abort(.unauthorized, reason: "Your session has expired. Please sign in again.")
        }

        guard
            let userID = UUID(uuidString: payload.subject.value),
            let user = try await User.find(userID, on: request.db)
        else {
            throw Abort(.unauthorized)
        }

        request.auth.login(user)
        return try await next.respond(to: request)
    }
}
