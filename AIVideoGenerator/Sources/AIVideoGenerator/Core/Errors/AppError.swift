import Foundation

/// A user-facing error surfaced anywhere in the app. Conforms to `LocalizedError` so
/// it can be thrown, caught, and displayed via a single alert/toast presentation path.
enum AppError: LocalizedError, Equatable, Sendable {
    case network(NetworkError)
    case validation(String)
    case providerUnavailable(String)
    case insufficientCredits
    case contentModerationRejected(reason: String)
    case authenticationFailed(String)
    case storage(String)
    case unknown

    var errorDescription: String? {
        switch self {
        case .network(let networkError):
            return networkError.errorDescription
        case .validation(let message):
            return message
        case .providerUnavailable(let providerName):
            return "\(providerName) is currently unavailable. Please choose a different provider in Settings or try again shortly."
        case .insufficientCredits:
            return "You've used all your generation credits for this plan. Upgrade or wait for your monthly reset to continue."
        case .contentModerationRejected(let reason):
            return "This request couldn't be generated: \(reason)"
        case .authenticationFailed(let message):
            return message
        case .storage(let message):
            return message
        case .unknown:
            return "Something went wrong. Please try again."
        }
    }
}
