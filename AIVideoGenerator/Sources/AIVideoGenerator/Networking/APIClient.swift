import Foundation

/// Abstraction over the backend HTTP transport so view models and services can be
/// unit tested against a fake without spinning up real network calls.
protocol APIClienting: Sendable {
    func send(_ endpoint: Endpoint) async throws -> Data
    func send<Response: Decodable>(_ endpoint: Endpoint, decoding: Response.Type) async throws -> Response
}

/// Default `URLSession`-backed implementation of `APIClienting`. Attaches auth
/// tokens from `AuthTokenProviding`, retries idempotent GETs once on transient
/// failure, and maps transport/HTTP errors onto `NetworkError`.
final actor APIClient: APIClienting {
    private let baseURL: URL
    private let session: URLSession
    private let tokenProvider: AuthTokenProviding

    init(baseURL: URL, session: URLSession = .shared, tokenProvider: AuthTokenProviding) {
        self.baseURL = baseURL
        self.session = session
        self.tokenProvider = tokenProvider
    }

    func send(_ endpoint: Endpoint) async throws -> Data {
        let request = try await buildRequest(for: endpoint)
        return try await execute(request, allowRetry: endpoint.method == .get)
    }

    func send<Response: Decodable>(_ endpoint: Endpoint, decoding: Response.Type) async throws -> Response {
        let data = try await send(endpoint)
        do {
            return try JSONDecoder.api.decode(Response.self, from: data)
        } catch {
            throw NetworkError.decoding(String(describing: error))
        }
    }

    private func buildRequest(for endpoint: Endpoint) async throws -> URLRequest {
        guard var components = URLComponents(url: baseURL.appendingPathComponent(endpoint.path), resolvingAgainstBaseURL: false) else {
            throw NetworkError.invalidURL
        }
        components.queryItems = endpoint.queryItems.isEmpty ? nil : endpoint.queryItems
        guard let url = components.url else { throw NetworkError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30

        if endpoint.requiresAuth, let token = await tokenProvider.currentToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func execute(_ request: URLRequest, allowRetry: Bool) async throws -> Data {
        do {
            let (data, response) = try await session.data(for: request)
            return try validate(data: data, response: response)
        } catch let error as NetworkError {
            if allowRetry, case .timeout = error {
                let (data, response) = try await session.data(for: request)
                return try validate(data: data, response: response)
            }
            throw error
        } catch let urlError as URLError {
            throw map(urlError)
        }
    }

    private func validate(data: Data, response: URLResponse) throws -> Data {
        guard let httpResponse = response as? HTTPURLResponse else { return data }

        switch httpResponse.statusCode {
        case 200...299:
            return data
        case 401:
            throw NetworkError.unauthorized
        case 429:
            let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After").flatMap(TimeInterval.init)
            throw NetworkError.rateLimited(retryAfter: retryAfter)
        default:
            let message = String(data: data, encoding: .utf8)
            AppLogger.networking.error("Request failed with status \(httpResponse.statusCode): \(message ?? "no body")")
            throw NetworkError.server(statusCode: httpResponse.statusCode, message: message)
        }
    }

    private func map(_ error: URLError) -> NetworkError {
        switch error.code {
        case .notConnectedToInternet, .networkConnectionLost:
            return .noConnection
        case .timedOut:
            return .timeout
        case .cancelled:
            return .cancelled
        default:
            return .server(statusCode: -1, message: error.localizedDescription)
        }
    }
}

/// Supplies the bearer token for authenticated requests. Implemented by `AuthService`
/// so `APIClient` never touches the Keychain directly.
protocol AuthTokenProviding: Sendable {
    func currentToken() async -> String?
}
