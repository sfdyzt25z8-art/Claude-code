import Vapor

struct MeController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let protected = routes.grouped("v1", "me").grouped(UserAuthenticator())
        protected.get(use: me)
    }

    func me(req: Request) async throws -> UserDTO {
        try req.auth.require(User.self).asPublicDTO()
    }
}
