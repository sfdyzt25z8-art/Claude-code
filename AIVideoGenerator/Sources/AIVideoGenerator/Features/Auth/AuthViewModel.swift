import Foundation
import Observation

/// Backs the sign-in / sign-up flow. Delegates all credential handling to
/// `AuthServiceProviding` — this view model only tracks form state and
/// presentation concerns (mode, loading, error).
@MainActor
@Observable
final class AuthViewModel {
    enum Mode {
        case signIn, signUp
    }

    var mode: Mode = .signIn
    var email: String = ""
    var password: String = ""
    var displayName: String = ""
    private(set) var isLoading = false
    var lastError: AppError?

    private let authService: AuthServiceProviding

    init(authService: AuthServiceProviding) {
        self.authService = authService
    }

    var canSubmit: Bool {
        guard !isLoading, !email.isEmpty, password.count >= 8 else { return false }
        return mode == .signIn || !displayName.isEmpty
    }

    func submitEmailFlow() async -> Bool {
        isLoading = true
        defer { isLoading = false }
        do {
            switch mode {
            case .signIn:
                _ = try await authService.signIn(email: email, password: password)
            case .signUp:
                _ = try await authService.signUp(email: email, password: password, displayName: displayName)
            }
            return true
        } catch {
            lastError = error as? AppError ?? .unknown
            return false
        }
    }

    func signInWithApple() async -> Bool {
        await performProviderSignIn { try await self.authService.signInWithApple() }
    }

    func signInWithGoogle() async -> Bool {
        await performProviderSignIn { try await self.authService.signInWithGoogle() }
    }

    func sendPasswordReset() async {
        do {
            try await authService.sendPasswordReset(email: email)
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    private func performProviderSignIn(_ operation: @escaping () async throws -> User) async -> Bool {
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await operation()
            return true
        } catch {
            lastError = error as? AppError ?? .unknown
            return false
        }
    }
}
