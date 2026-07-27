import Foundation

/// AI-assisted prompt tooling: improve/expand/shorten/translate the user's prompt,
/// and suggest styles, lighting, camera movements, moods, environments, and shots.
/// Backed by the same backend the generation jobs use, kept behind a protocol so
/// the Video Generator screen can be developed and tested against `MockPromptAssistant`.
protocol PromptAssisting: Sendable {
    func rewrite(prompt: String, action: PromptAssistAction) async throws -> String
    func suggestStyles(for prompt: String) async throws -> [VideoStyle]
    func suggestLighting(for prompt: String) async throws -> [LightingStyle]
    func suggestCameraMovements(for prompt: String) async throws -> [CameraMovement]
}

/// Backend-backed implementation that calls `/v1/prompt-assist`.
struct RemotePromptAssistant: PromptAssisting {
    let apiClient: APIClienting

    func rewrite(prompt: String, action: PromptAssistAction) async throws -> String {
        struct Response: Decodable { let result: String }
        let response = try await apiClient.send(.promptAssist(action: action, prompt: prompt), decoding: Response.self)
        return response.result
    }

    func suggestStyles(for prompt: String) async throws -> [VideoStyle] {
        struct Response: Decodable { let styles: [VideoStyle] }
        let response = try await apiClient.send(.promptAssist(action: .suggestStyles, prompt: prompt), decoding: Response.self)
        return response.styles
    }

    func suggestLighting(for prompt: String) async throws -> [LightingStyle] {
        struct Response: Decodable { let lighting: [LightingStyle] }
        let response = try await apiClient.send(.promptAssist(action: .suggestLighting, prompt: prompt), decoding: Response.self)
        return response.lighting
    }

    func suggestCameraMovements(for prompt: String) async throws -> [CameraMovement] {
        struct Response: Decodable { let cameraMovements: [CameraMovement] }
        let response = try await apiClient.send(.promptAssist(action: .suggestCameraMovements, prompt: prompt), decoding: Response.self)
        return response.cameraMovements
    }
}

/// Deterministic offline assistant used for previews, tests, and before a backend
/// is configured. Applies simple, explainable heuristics rather than calling out
/// to any network or on-device model.
struct MockPromptAssistant: PromptAssisting {
    func rewrite(prompt: String, action: PromptAssistAction) async throws -> String {
        switch action {
        case .improve:
            return "\(prompt), highly detailed, dramatic lighting, cinematic composition, sharp focus"
        case .expand:
            return "\(prompt). The scene unfolds with rich atmosphere, intricate background detail, and a strong sense of depth and scale."
        case .shorten:
            return String(prompt.split(separator: " ").prefix(12).joined(separator: " "))
        case .translate:
            return prompt
        default:
            return prompt
        }
    }

    func suggestStyles(for prompt: String) async throws -> [VideoStyle] {
        [.cinematic, .photorealistic, .sciFi]
    }

    func suggestLighting(for prompt: String) async throws -> [LightingStyle] {
        [.goldenHour, .volumetric, .neon]
    }

    func suggestCameraMovements(for prompt: String) async throws -> [CameraMovement] {
        [.slowZoom, .drone, .cinematicDolly]
    }
}
