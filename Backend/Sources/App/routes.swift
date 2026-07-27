import Vapor

func routes(_ app: Application) throws {
    let providerService = MockVideoProviderService()
    let moderationService = KeywordModerationService()

    try app.register(collection: AuthController())
    try app.register(collection: MeController())
    try app.register(collection: ProvidersController(providerService: providerService))
    try app.register(collection: PromptAssistController())
    try app.register(collection: JobsController(providerService: providerService, moderationService: moderationService))

    app.get("health") { _ in "OK" }
}
