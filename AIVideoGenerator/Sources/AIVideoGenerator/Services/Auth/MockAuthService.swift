import Foundation
import Observation

/// Offline auth implementation used for previews, tests, and local development.
/// Simulates network latency and persists the "signed in" state only in memory
/// plus a lightweight Keychain-backed session token, mirroring how a real
/// implementation would behave without requiring backend credentials.
@MainActor
@Observable
final class MockAuthService: AuthServiceProviding {
    private(set) var currentUser: User?
    private let keychain: KeychainStore
    private static let sessionKey = "session_token"

    init(keychain: KeychainStore = KeychainStore()) {
        self.keychain = keychain
    }

    func signInWithApple() async throws -> User {
        try await simulateLatency()
        return try persist(makeUser(provider: .apple, displayName: "Apple User", email: nil))
    }

    func signInWithGoogle() async throws -> User {
        try await simulateLatency()
        return try persist(makeUser(provider: .google, displayName: "Google User", email: "user@gmail.com"))
    }

    func signIn(email: String, password: String) async throws -> User {
        try await simulateLatency()
        guard !email.isEmpty, password.count >= 8 else {
            throw AppError.authenticationFailed("Enter a valid email and a password of at least 8 characters.")
        }
        return try persist(makeUser(provider: .email, displayName: email.components(separatedBy: "@").first ?? "User", email: email))
    }

    func signUp(email: String, password: String, displayName: String) async throws -> User {
        try await simulateLatency()
        guard !email.isEmpty, password.count >= 8, !displayName.isEmpty else {
            throw AppError.authenticationFailed("Fill in all fields with a password of at least 8 characters.")
        }
        return try persist(makeUser(provider: .email, displayName: displayName, email: email))
    }

    func sendPasswordReset(email: String) async throws {
        try await simulateLatency()
        guard !email.isEmpty else {
            throw AppError.authenticationFailed("Enter the email associated with your account.")
        }
    }

    func signOut() async {
        try? keychain.remove(Self.sessionKey)
        currentUser = nil
    }

    func restoreSession() async {
        guard let token = (try? keychain.string(for: Self.sessionKey)) ?? nil, !token.isEmpty else {
            return
        }
        currentUser = makeUser(provider: .email, displayName: "Welcome Back", email: nil)
    }

    func currentToken() async -> String? {
        try? keychain.string(for: Self.sessionKey)
    }

    private func persist(_ user: User) throws -> User {
        try keychain.set(UUID().uuidString, for: Self.sessionKey)
        currentUser = user
        return user
    }

    private func makeUser(provider: User.AuthProvider, displayName: String, email: String?) -> User {
        User(id: UUID(), displayName: displayName, email: email, authProvider: provider, subscription: .free, createdAt: .now)
    }

    private func simulateLatency() async throws {
        try await Task.sleep(nanoseconds: 500_000_000)
    }
}
