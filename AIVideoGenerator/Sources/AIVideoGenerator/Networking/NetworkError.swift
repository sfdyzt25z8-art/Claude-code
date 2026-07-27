import Foundation

/// Errors surfaced by `APIClient`, mapped from URLSession/HTTP failures into
/// something the UI layer can present directly without knowing about transport details.
enum NetworkError: LocalizedError, Equatable, Sendable {
    case invalidURL
    case noConnection
    case timeout
    case unauthorized
    case rateLimited(retryAfter: TimeInterval?)
    case server(statusCode: Int, message: String?)
    case decoding(String)
    case cancelled

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "That request couldn't be built. Please try again."
        case .noConnection:
            return "You're offline. Check your connection and try again."
        case .timeout:
            return "The request timed out. Please try again."
        case .unauthorized:
            return "Your session has expired. Please sign in again."
        case .rateLimited(let retryAfter):
            if let retryAfter {
                return "You're generating too quickly. Try again in \(Int(retryAfter))s."
            }
            return "You're generating too quickly. Please slow down and try again shortly."
        case .server(let statusCode, let message):
            return message ?? "The server returned an error (\(statusCode))."
        case .decoding:
            return "We couldn't read the server's response."
        case .cancelled:
            return "The request was cancelled."
        }
    }
}
