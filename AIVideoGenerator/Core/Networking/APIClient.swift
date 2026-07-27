import Foundation

/// Thin async/await wrapper around `URLSession` shared by every backend
/// service. Kept deliberately small and dependency-free so it can be
/// swapped for a generated GraphQL/REST client later without touching
/// call sites that depend on `APIClientProtocol`.
protocol APIClientProtocol: Sendable {
    func send<Response: Decodable>(_ endpoint: APIEndpoint, as type: Response.Type) async throws -> Response
    func send(_ endpoint: APIEndpoint) async throws
}

final class APIClient: APIClientProtocol, @unchecked Sendable {
    private let baseURL: URL
    private let session: URLSession
    private let tokenStore: AuthTokenStoring
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(baseURL: URL, session: URLSession = .shared, tokenStore: AuthTokenStoring) {
        self.baseURL = baseURL
        self.session = session
        self.tokenStore = tokenStore

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder = decoder

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        self.encoder = encoder
    }

    func send<Response: Decodable>(_ endpoint: APIEndpoint, as type: Response.Type) async throws -> Response {
        let data = try await performRequest(endpoint)
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(underlying: error.localizedDescription)
        }
    }

    func send(_ endpoint: APIEndpoint) async throws {
        _ = try await performRequest(endpoint)
    }

    @discardableResult
    private func performRequest(_ endpoint: APIEndpoint) async throws -> Data {
        let token = endpoint.requiresAuth ? await tokenStore.currentToken() : nil
        let request = try endpoint.urlRequest(baseURL: baseURL, authToken: token)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
            throw APIError.offline
        } catch {
            throw APIError.transport(underlying: error.localizedDescription)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.transport(underlying: "No HTTP response received.")
        }

        switch httpResponse.statusCode {
        case 200..<300:
            return data
        case 401:
            throw APIError.unauthorized
        case 429:
            let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After").flatMap(TimeInterval.init)
            throw APIError.rateLimited(retryAfter: retryAfter)
        default:
            let message = String(data: data, encoding: .utf8)
            throw APIError.server(statusCode: httpResponse.statusCode, message: message)
        }
    }
}
