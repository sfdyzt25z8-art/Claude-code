import Foundation

/// Uniform networking error surfaced by ``APIClient``. Feature-level errors
/// (content policy, quota, etc.) are modeled separately in ``ProviderError``.
enum APIError: LocalizedError, Sendable {
    case invalidURL
    case transport(underlying: String)
    case decoding(underlying: String)
    case server(statusCode: Int, message: String?)
    case unauthorized
    case rateLimited(retryAfter: TimeInterval?)
    case offline

    var errorDescription: String? {
        switch self {
        case .invalidURL: "The request URL was invalid."
        case .transport(let underlying): "Network error: \(underlying)"
        case .decoding(let underlying): "Failed to parse server response: \(underlying)"
        case .server(let statusCode, let message): message ?? "Server returned an error (\(statusCode))."
        case .unauthorized: "Your session has expired. Please sign in again."
        case .rateLimited: "Too many requests. Please try again shortly."
        case .offline: "You appear to be offline. Some features may be unavailable."
        }
    }
}
