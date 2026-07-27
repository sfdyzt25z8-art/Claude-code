import Vapor

struct PromptAssistRequestDTO: Content {
    let action: String
    let prompt: String
}

/// A single response shape covering every `PromptAssistAction` — the client
/// decodes only the field(s) it expects for the action it sent
/// (`RemotePromptAssistant` on the client), so unused fields being `nil`
/// here is fine; `Decodable` ignores keys it doesn't declare.
struct PromptAssistResponseDTO: Content {
    let result: String?
    let styles: [String]?
    let lighting: [String]?
    let cameraMovements: [String]?
}

/// Real (if simple, rule-based) prompt rewriting/suggestion — mirrors
/// `MockPromptAssistant` on the client. Swapping in an actual LLM call is a
/// matter of replacing the bodies of these cases with a real API request.
struct PromptAssistController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.grouped("v1", "prompt-assist")
            .grouped(UserAuthenticator())
            .post(use: assist)
    }

    func assist(req: Request) async throws -> PromptAssistResponseDTO {
        let payload = try req.content.decode(PromptAssistRequestDTO.self)

        switch payload.action {
        case "improve":
            return PromptAssistResponseDTO(
                result: "\(payload.prompt), highly detailed, dramatic lighting, cinematic composition, sharp focus",
                styles: nil, lighting: nil, cameraMovements: nil
            )
        case "expand":
            return PromptAssistResponseDTO(
                result: "\(payload.prompt). The scene unfolds with rich atmosphere, intricate background detail, and a strong sense of depth and scale.",
                styles: nil, lighting: nil, cameraMovements: nil
            )
        case "shorten":
            let shortened = payload.prompt.split(separator: " ").prefix(12).joined(separator: " ")
            return PromptAssistResponseDTO(result: shortened, styles: nil, lighting: nil, cameraMovements: nil)
        case "translate":
            return PromptAssistResponseDTO(result: payload.prompt, styles: nil, lighting: nil, cameraMovements: nil)
        case "suggestStyles":
            return PromptAssistResponseDTO(result: nil, styles: ["cinematic", "photorealistic", "sciFi"], lighting: nil, cameraMovements: nil)
        case "suggestLighting":
            return PromptAssistResponseDTO(result: nil, styles: nil, lighting: ["goldenHour", "volumetric", "neon"], cameraMovements: nil)
        case "suggestCameraMovements":
            return PromptAssistResponseDTO(result: nil, styles: nil, lighting: nil, cameraMovements: ["slowZoom", "drone", "cinematicDolly"])
        default:
            return PromptAssistResponseDTO(result: payload.prompt, styles: nil, lighting: nil, cameraMovements: nil)
        }
    }
}
