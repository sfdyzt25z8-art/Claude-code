import XCTVapor
@testable import App

final class AppTests: XCTestCase {
    func testHealthCheck() async throws {
        let app = try await Application.make(.testing)
        do {
            try await configure(app)
            try await app.test(.GET, "health") { res in
                XCTAssertEqual(res.status, .ok)
            }
        } catch {
            try? await app.asyncShutdown()
            throw error
        }
        try await app.asyncShutdown()
    }

    func testSignUpAndSignIn() async throws {
        let app = try await Application.make(.testing)
        do {
            try await configure(app)

            try await app.test(.POST, "v1/auth/signup", beforeRequest: { req in
                try req.content.encode(SignUpRequest(email: "test@example.com", password: "password123", displayName: "Test User"))
            }, afterResponse: { res in
                XCTAssertEqual(res.status, .ok)
                let body = try res.content.decode(AuthResponse.self)
                XCTAssertEqual(body.user.email, "test@example.com")
            })

            try await app.test(.POST, "v1/auth/signin", beforeRequest: { req in
                try req.content.encode(SignInRequest(email: "test@example.com", password: "password123"))
            }, afterResponse: { res in
                XCTAssertEqual(res.status, .ok)
            })
        } catch {
            try? await app.asyncShutdown()
            throw error
        }
        try await app.asyncShutdown()
    }
}
