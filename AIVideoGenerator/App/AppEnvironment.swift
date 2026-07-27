import Foundation

/// Composition root. Builds every service and injects them into the view
/// hierarchy via `@EnvironmentObject`, keeping feature code decoupled from
/// concrete implementations (dependency injection instead of singletons).
@MainActor
final class AppEnvironment: ObservableObject {
    let providerRegistry: ProviderRegistry
    let authService: AuthService
    let mockAuthService: MockAuthService
    let projectStore: ProjectStoreProtocol
    let jobQueue: JobQueueService
    let promptAssistant: PromptAssistantService
    let storageUsageService: StorageUsageServiceProtocol
    let tokenStore: AuthTokenStoring

    /// When `true` (the default for App Store demo / preview builds), auth
    /// and generation run entirely against local mock implementations so
    /// the app is fully explorable before a production backend is deployed.
    let isRunningInDemoMode: Bool

    init(backendBaseURL: URL = URL(string: "https://api.aivideogenerator.app")!, isRunningInDemoMode: Bool = true) {
        self.isRunningInDemoMode = isRunningInDemoMode

        let mockProvider = MockAIProvider()
        self.providerRegistry = ProviderRegistry(
            videoProviders: [mockProvider],
            thumbnailProviders: [mockProvider],
            promptAssistProviders: [mockProvider]
        )

        let tokenStore = AuthTokenStore()
        self.tokenStore = tokenStore
        let apiClient = APIClient(baseURL: backendBaseURL, tokenStore: tokenStore)
        self.authService = AuthService(apiClient: apiClient, tokenStore: tokenStore)
        self.mockAuthService = MockAuthService()

        let projectStore = LocalProjectStore()
        self.projectStore = projectStore
        self.jobQueue = JobQueueService(providerRegistry: providerRegistry, projectStore: projectStore)
        self.promptAssistant = PromptAssistantService(providerRegistry: providerRegistry)
        self.storageUsageService = StorageUsageService()
    }
}
