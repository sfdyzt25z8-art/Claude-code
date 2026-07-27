import Foundation
import Observation

/// Composition root for the app. Every service is constructed here, once, and
/// handed down through the environment via `@Environment(DependencyContainer.self)` —
/// features depend on protocols (`AuthServiceProviding`, `ProjectStoring`,
/// `GenerationQueueManaging`, …) and never reach for a singleton, which keeps
/// every view model unit-testable in isolation with fakes substituted in
/// `DependencyContainer.preview`. `@Observable` here exists solely to opt into
/// SwiftUI's environment injection for MainActor model types, not for change tracking.
@MainActor
@Observable
final class DependencyContainer {
    let authService: AuthServiceProviding
    let projectStore: ProjectStoring
    let providerRegistry: ProviderRegistry
    let queueManager: GenerationQueueManaging
    let promptAssistant: PromptAssisting
    let apiClient: APIClienting

    init(
        authService: AuthServiceProviding,
        projectStore: ProjectStoring,
        providerRegistry: ProviderRegistry,
        queueManager: GenerationQueueManaging,
        promptAssistant: PromptAssisting,
        apiClient: APIClienting
    ) {
        self.authService = authService
        self.projectStore = projectStore
        self.providerRegistry = providerRegistry
        self.queueManager = queueManager
        self.promptAssistant = promptAssistant
        self.apiClient = apiClient
    }

    /// Production composition. Currently wires the offline mock providers so the
    /// app is fully usable before real provider credentials/backend endpoints are
    /// configured; swapping in real implementations only touches this initializer.
    static func live() -> DependencyContainer {
        let authService = MockAuthService()
        let projectStore = LocalProjectStore()
        let registry = ProviderRegistry()
        registry.register(videoProvider: MockAIVideoProvider())
        registry.register(thumbnailProvider: MockAIThumbnailProvider())

        return DependencyContainer(
            authService: authService,
            projectStore: projectStore,
            providerRegistry: registry,
            queueManager: GenerationQueueManager(providerRegistry: registry, projectStore: projectStore),
            promptAssistant: MockPromptAssistant(),
            apiClient: APIClient(
                baseURL: URL(string: "https://api.aivideogenerator.app")!,
                tokenProvider: authService
            )
        )
    }

    /// Lightweight composition for SwiftUI previews and unit tests.
    static func preview() -> DependencyContainer {
        live()
    }
}
