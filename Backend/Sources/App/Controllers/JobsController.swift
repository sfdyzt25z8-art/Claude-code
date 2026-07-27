import Vapor
import Fluent

struct CreateVideoJobRequest: Content {
    let prompt: String
    let providerID: String
    // The client's full `GenerationRequest` carries many more generation
    // parameters (style, resolution, frame rate, camera/lighting, duration).
    // This server contract only threads `prompt`/`providerID` through today —
    // extending `GenerationJobRecord` and this DTO to carry the rest is a
    // follow-up, not a design limitation.
}

struct CreateThumbnailJobRequest: Content {
    let prompt: String
    let category: String
    let providerID: String
}

/// Video/thumbnail generation jobs. Every route here requires a bearer
/// token; `UserAuthenticator` populates `req.auth` before these handlers run.
struct JobsController: RouteCollection {
    let providerService: VideoProviderService
    let moderationService: ModerationService

    func boot(routes: RoutesBuilder) throws {
        let jobs = routes.grouped("v1", "jobs").grouped(UserAuthenticator())
        jobs.post("video", use: createVideoJob)
        jobs.post("thumbnail", use: createThumbnailJob)
        jobs.get(":jobID", use: getJob)
        jobs.post(":jobID", "cancel", use: cancelJob)
    }

    func createVideoJob(req: Request) async throws -> JobDTO {
        let user = try req.auth.require(User.self)
        let payload = try req.content.decode(CreateVideoJobRequest.self)

        if case .rejected(let reason) = moderationService.evaluate(prompt: payload.prompt) {
            throw Abort(.forbidden, reason: reason)
        }
        guard user.usedGenerationCredits < user.monthlyGenerationCredits else {
            throw Abort(.paymentRequired, reason: "You've used all your generation credits for this plan.")
        }

        let job = GenerationJobRecord(
            userID: try user.requireID(),
            kind: "video",
            title: String(payload.prompt.prefix(48)),
            providerID: payload.providerID
        )
        try await job.save(on: req.db)

        user.usedGenerationCredits += 1
        try await user.save(on: req.db)

        let appDB = req.application.db
        let service = providerService
        Task {
            await service.simulateGeneration(job: job, db: appDB)
        }

        return try job.asDTO()
    }

    func createThumbnailJob(req: Request) async throws -> JobDTO {
        let user = try req.auth.require(User.self)
        let payload = try req.content.decode(CreateThumbnailJobRequest.self)

        if case .rejected(let reason) = moderationService.evaluate(prompt: payload.prompt) {
            throw Abort(.forbidden, reason: reason)
        }
        guard user.usedGenerationCredits < user.monthlyGenerationCredits else {
            throw Abort(.paymentRequired, reason: "You've used all your generation credits for this plan.")
        }

        let job = GenerationJobRecord(
            userID: try user.requireID(),
            kind: "thumbnail",
            title: String(payload.prompt.prefix(48)),
            providerID: payload.providerID
        )
        try await job.save(on: req.db)

        user.usedGenerationCredits += 1
        try await user.save(on: req.db)

        let appDB = req.application.db
        let service = providerService
        Task {
            await service.simulateGeneration(job: job, db: appDB)
        }

        return try job.asDTO()
    }

    func getJob(req: Request) async throws -> JobDTO {
        let job = try await ownedJob(req: req)
        return try job.asDTO()
    }

    func cancelJob(req: Request) async throws -> JobDTO {
        let job = try await ownedJob(req: req)
        job.status = "cancelled"
        try await job.save(on: req.db)
        return try job.asDTO()
    }

    private func ownedJob(req: Request) async throws -> GenerationJobRecord {
        let user = try req.auth.require(User.self)
        guard
            let jobID = req.parameters.get("jobID", as: UUID.self),
            let job = try await GenerationJobRecord.find(jobID, on: req.db),
            try job.$user.id == user.requireID()
        else {
            throw Abort(.notFound)
        }
        return job
    }
}
