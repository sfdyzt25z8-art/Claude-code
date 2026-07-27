import Foundation
import AuthenticationServices

@MainActor
protocol AuthServiceProtocol: AnyObject {
    @MainActor var currentUser: User? { get }
    func signInWithApple() async throws -> User
    func signInWithGoogle() async throws -> User
    func signIn(email: String, password: String) async throws -> User
    func signUp(email: String, password: String, displayName: String) async throws -> User
    func requestPasswordReset(email: String) async throws
    func signOut() async
}

/// Production-shaped authentication service. Apple Sign In uses the native
/// `AuthenticationServices` framework directly. Google Sign In uses an
/// OAuth 2.0 authorization-code flow over `ASWebAuthenticationSession` so no
/// third-party SDK dependency is required. Email/password flows call the
/// configured backend; wire `baseURL` to a real deployment before shipping.
@MainActor
final class AuthService: NSObject, AuthServiceProtocol, ObservableObject {
    @Published private(set) var currentUser: User?

    private let apiClient: APIClientProtocol
    private let tokenStore: AuthTokenStoring
    private var appleSignInContinuation: CheckedContinuation<ASAuthorization, Error>?
    private lazy var webAuthContextProvider = WebAuthPresentationContextProvider()

    init(apiClient: APIClientProtocol, tokenStore: AuthTokenStoring) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
    }

    // MARK: - Apple

    func signInWithApple() async throws -> User {
        let authorization = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<ASAuthorization, Error>) in
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            appleSignInContinuation = continuation
            controller.performRequests()
        }

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let identityTokenData = credential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            throw ProviderError.invalidRequest("Apple did not return a valid identity token.")
        }

        let displayName = [credential.fullName?.givenName, credential.fullName?.familyName]
            .compactMap { $0 }
            .joined(separator: " ")

        return try await exchangeSocialToken(
            provider: .apple,
            identityToken: identityToken,
            fallbackEmail: credential.email,
            fallbackName: displayName.isEmpty ? nil : displayName
        )
    }

    // MARK: - Google (OAuth via ASWebAuthenticationSession, no 3rd-party SDK)

    func signInWithGoogle() async throws -> User {
        // NOTE: Replace with your OAuth client ID / redirect scheme registered
        // in Google Cloud Console before shipping.
        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com"),
            URLQueryItem(name: "redirect_uri", value: "com.aivideogenerator.app:/oauth2redirect"),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile")
        ]

        guard let authURL = components.url else {
            throw ProviderError.invalidRequest("Malformed Google OAuth URL.")
        }

        let callbackURL = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: "com.aivideogenerator.app"
            ) { callbackURL, error in
                if let callbackURL {
                    continuation.resume(returning: callbackURL)
                } else {
                    continuation.resume(throwing: error ?? ProviderError.cancelled)
                }
            }
            session.presentationContextProvider = webAuthContextProvider
            session.prefersEphemeralWebBrowserSession = true
            session.start()
        }

        guard let code = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "code" })?.value else {
            throw ProviderError.invalidRequest("Google did not return an authorization code.")
        }

        return try await exchangeSocialToken(provider: .google, identityToken: code, fallbackEmail: nil, fallbackName: nil)
    }

    // MARK: - Email / Password

    func signIn(email: String, password: String) async throws -> User {
        let body = try JSONEncoder().encode(["email": email, "password": password])
        let response = try await apiClient.send(
            APIEndpoint(path: "/auth/login", method: .post, body: body, requiresAuth: false),
            as: AuthResponse.self
        )
        return try await persist(response)
    }

    func signUp(email: String, password: String, displayName: String) async throws -> User {
        let body = try JSONEncoder().encode(["email": email, "password": password, "displayName": displayName])
        let response = try await apiClient.send(
            APIEndpoint(path: "/auth/signup", method: .post, body: body, requiresAuth: false),
            as: AuthResponse.self
        )
        return try await persist(response)
    }

    func requestPasswordReset(email: String) async throws {
        let body = try JSONEncoder().encode(["email": email])
        try await apiClient.send(APIEndpoint(path: "/auth/password-reset", method: .post, body: body, requiresAuth: false))
    }

    func signOut() async {
        await tokenStore.clear()
        currentUser = nil
    }

    // MARK: - Shared token exchange

    private func exchangeSocialToken(provider: User.AuthProvider, identityToken: String, fallbackEmail: String?, fallbackName: String?) async throws -> User {
        let body = try JSONEncoder().encode([
            "provider": provider.rawValue,
            "token": identityToken,
            "email": fallbackEmail ?? "",
            "displayName": fallbackName ?? ""
        ])
        let response = try await apiClient.send(
            APIEndpoint(path: "/auth/social", method: .post, body: body, requiresAuth: false),
            as: AuthResponse.self
        )
        return try await persist(response)
    }

    private func persist(_ response: AuthResponse) async throws -> User {
        await tokenStore.save(token: response.accessToken)
        currentUser = response.user
        return response.user
    }
}

private struct AuthResponse: Decodable {
    let accessToken: String
    let user: User
}

extension AuthService: ASAuthorizationControllerDelegate {
    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        Task { @MainActor in
            appleSignInContinuation?.resume(returning: authorization)
            appleSignInContinuation = nil
        }
    }

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        Task { @MainActor in
            appleSignInContinuation?.resume(throwing: error)
            appleSignInContinuation = nil
        }
    }
}

extension AuthService: ASAuthorizationControllerPresentationContextProviding {
    nonisolated func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            ASPresentationAnchor()
        }
    }
}

/// Supplies the presentation window for `ASWebAuthenticationSession`.
private final class WebAuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        ASPresentationAnchor()
    }
}
