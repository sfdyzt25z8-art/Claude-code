import Foundation

/// The app's authentication surface: Sign in with Apple, Google Sign-In, and
/// email/password, backed by the Keychain for token storage. Conforms to
/// `AuthTokenProviding` so `APIClient` can pull the current bearer token without
/// depending on the concrete auth implementation.
@MainActor
protocol AuthServiceProviding: AnyObject, AuthTokenProviding {
    var currentUser: User? { get }

    func signInWithApple() async throws -> User
    func signInWithGoogle() async throws -> User
    func signIn(email: String, password: String) async throws -> User
    func signUp(email: String, password: String, displayName: String) async throws -> User
    func sendPasswordReset(email: String) async throws
    func signOut() async
    func restoreSession() async
}
