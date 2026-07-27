import Foundation

/// Fully functional in-memory auth service used for previews, unit tests,
/// and demo builds that aren't yet wired to a production backend. Persists
/// the "signed in" state only for the lifetime of the process.
@MainActor
final class MockAuthService: AuthServiceProtocol, ObservableObject {
    @Published private(set) var currentUser: User?

    private var registeredUsers: [String: (password: String, user: User)] = [:]

    func signInWithApple() async throws -> User {
        try await simulateNetworkDelay()
        let user = User(email: "demo.user@icloud.com", displayName: "Demo User", authProvider: .apple)
        currentUser = user
        return user
    }

    func signInWithGoogle() async throws -> User {
        try await simulateNetworkDelay()
        let user = User(email: "demo.user@gmail.com", displayName: "Demo User", authProvider: .google)
        currentUser = user
        return user
    }

    func signIn(email: String, password: String) async throws -> User {
        try await simulateNetworkDelay()
        guard let record = registeredUsers[email.lowercased()], record.password == password else {
            throw ProviderError.invalidRequest("Incorrect email or password.")
        }
        currentUser = record.user
        return record.user
    }

    func signUp(email: String, password: String, displayName: String) async throws -> User {
        try await simulateNetworkDelay()
        guard !email.isEmpty, password.count >= 8 else {
            throw ProviderError.invalidRequest("Password must be at least 8 characters.")
        }
        let user = User(email: email, displayName: displayName.isEmpty ? "New User" : displayName, authProvider: .email)
        registeredUsers[email.lowercased()] = (password, user)
        currentUser = user
        return user
    }

    func requestPasswordReset(email: String) async throws {
        try await simulateNetworkDelay()
    }

    func signOut() async {
        currentUser = nil
    }

    private func simulateNetworkDelay() async throws {
        try await Task.sleep(for: .milliseconds(500))
    }
}
