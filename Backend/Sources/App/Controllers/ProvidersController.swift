import Vapor

/// Public — matches the client's `Endpoint.providers` (`requiresAuth: false`),
/// since the app needs to list providers before a user signs in.
struct ProvidersController: RouteCollection {
    let providerService: VideoProviderService

    func boot(routes: RoutesBuilder) throws {
        routes.get("v1", "providers", use: list)
    }

    func list(req: Request) async throws -> [ProviderInfo] {
        providerService.availableProviders()
    }
}
