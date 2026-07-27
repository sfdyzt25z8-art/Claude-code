import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    enum Mode: Equatable {
        case signIn, signUp
    }

    @Published var mode: Mode = .signIn
    @Published var email = ""
    @Published var password = ""
    @Published var displayName = ""
    @Published var isLoading = false
    @Published var toast: Toast?
    @Published var showingForgotPassword = false

    private let authService: any AuthServiceProtocol

    init(authService: any AuthServiceProtocol) {
        self.authService = authService
    }

    var isFormValid: Bool {
        guard email.contains("@"), password.count >= 8 else { return false }
        if mode == .signUp { return !displayName.trimmingCharacters(in: .whitespaces).isEmpty }
        return true
    }

    func signInWithApple() async {
        await run { try await self.authService.signInWithApple() }
    }

    func signInWithGoogle() async {
        await run { try await self.authService.signInWithGoogle() }
    }

    func submitEmailForm() async {
        guard isFormValid else {
            toast = Toast(message: "Please fill out all fields correctly.", style: .error)
            return
        }
        await run {
            switch self.mode {
            case .signIn:
                try await self.authService.signIn(email: self.email, password: self.password)
            case .signUp:
                try await self.authService.signUp(email: self.email, password: self.password, displayName: self.displayName)
            }
        }
    }

    func requestPasswordReset() async {
        guard email.contains("@") else {
            toast = Toast(message: "Enter your email address first.", style: .error)
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            try await authService.requestPasswordReset(email: email)
            toast = Toast(message: "Password reset email sent.", style: .success)
            showingForgotPassword = false
        } catch {
            toast = Toast(message: error.localizedDescription, style: .error)
        }
    }

    private func run(_ operation: @escaping () async throws -> User) async {
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await operation()
        } catch {
            toast = Toast(message: error.localizedDescription, style: .error)
        }
    }
}
