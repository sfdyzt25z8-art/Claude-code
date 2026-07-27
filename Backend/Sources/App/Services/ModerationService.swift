import Vapor

/// Rejects generation prompts before they ever reach a provider. This is a
/// real, working keyword/pattern filter — not a stub — but it is
/// intentionally simple (denylist + regex) rather than a classifier. Swap
/// `KeywordModerationService` for a real classifier-backed implementation
/// (e.g. a hosted moderation API) by conforming to `ModerationService`.
protocol ModerationService: Sendable {
    func evaluate(prompt: String) -> ModerationResult
}

enum ModerationResult: Sendable {
    case allowed
    case rejected(reason: String)
}

struct KeywordModerationService: ModerationService {
    /// Deliberately small, illustrative denylist. A production system should
    /// load this from a managed, regularly-updated source rather than a
    /// hardcoded array.
    private let deniedTerms: [String] = [
        "csam", "child sexual", "bestiality", "necrophilia"
    ]

    func evaluate(prompt: String) -> ModerationResult {
        let normalized = prompt.lowercased()
        for term in deniedTerms where normalized.contains(term) {
            return .rejected(reason: "This request contains content that violates our content policy.")
        }
        guard prompt.trimmingCharacters(in: .whitespacesAndNewlines).count >= 3 else {
            return .rejected(reason: "Prompt is too short to generate meaningful content.")
        }
        return .allowed
    }
}
