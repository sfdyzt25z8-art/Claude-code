import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

/// A single REST endpoint on the AI Video Generator backend. Kept provider-agnostic:
/// the app never talks to a third-party AI provider directly — every generation
/// request goes through the backend's provider abstraction so API keys, rate
/// limits, and moderation stay server-side.
struct Endpoint {
    let path: String
    let method: HTTPMethod
    var queryItems: [URLQueryItem] = []
    var body: Data? = nil
    var requiresAuth: Bool = true

    static func createVideoJob(_ request: GenerationRequest) -> Endpoint {
        Endpoint(path: "/v1/jobs/video", method: .post, body: try? JSONEncoder.api.encode(request))
    }

    static func createThumbnailJob(category: ThumbnailCategory, prompt: String, providerID: String) -> Endpoint {
        let payload = ThumbnailJobPayload(category: category, prompt: prompt, providerID: providerID)
        return Endpoint(path: "/v1/jobs/thumbnail", method: .post, body: try? JSONEncoder.api.encode(payload))
    }

    static func job(id: UUID) -> Endpoint {
        Endpoint(path: "/v1/jobs/\(id.uuidString)", method: .get)
    }

    static func cancelJob(id: UUID) -> Endpoint {
        Endpoint(path: "/v1/jobs/\(id.uuidString)/cancel", method: .post)
    }

    static func promptAssist(action: PromptAssistAction, prompt: String) -> Endpoint {
        let payload = PromptAssistRequest(action: action, prompt: prompt)
        return Endpoint(path: "/v1/prompt-assist", method: .post, body: try? JSONEncoder.api.encode(payload))
    }

    static let currentUser = Endpoint(path: "/v1/me", method: .get)
    static let providers = Endpoint(path: "/v1/providers", method: .get, requiresAuth: false)
}

private struct ThumbnailJobPayload: Codable {
    let category: ThumbnailCategory
    let prompt: String
    let providerID: String
}

enum PromptAssistAction: String, Codable, Sendable {
    case improve, expand, shorten, translate
    case suggestStyles, suggestLighting, suggestCameraMovements, suggestMoods, suggestEnvironments, suggestShots
}

private struct PromptAssistRequest: Codable {
    let action: PromptAssistAction
    let prompt: String
}

extension JSONEncoder {
    static let api: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
        return encoder
    }()
}

extension JSONDecoder {
    static let api: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }()
}
