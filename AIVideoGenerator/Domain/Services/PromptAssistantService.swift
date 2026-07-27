import Foundation

/// Thin façade over the active `PromptAssistProviding` backend, used by the
/// Video Generator and Thumbnail Generator prompt fields to improve, expand,
/// shorten, translate, and suggest creative direction.
@MainActor
final class PromptAssistantService: ObservableObject {
    private let providerRegistry: ProviderRegistry

    init(providerRegistry: ProviderRegistry) {
        self.providerRegistry = providerRegistry
    }

    func assist(prompt: String, action: PromptAssistAction, targetLanguage: String? = nil) async throws -> String {
        guard let provider = providerRegistry.activePromptAssistProvider else {
            throw ProviderError.invalidRequest("No prompt assistant provider is configured.")
        }
        return try await provider.assist(prompt: prompt, action: action, targetLanguage: targetLanguage)
    }

    func suggest(category: PromptSuggestionCategory, context: String) async throws -> [String] {
        guard let provider = providerRegistry.activePromptAssistProvider else {
            throw ProviderError.invalidRequest("No prompt assistant provider is configured.")
        }
        return try await provider.suggest(category: category, context: context)
    }
}
