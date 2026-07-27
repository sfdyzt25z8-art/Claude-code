import Fluent
import Vapor

/// Server-side record of a generation job — mirrors the client's
/// `GenerationJob` (`Core/Models/GenerationJob.swift`) closely enough that
/// `JobDTO` maps 1:1 onto what the client already expects to decode.
final class GenerationJobRecord: Model, Content, @unchecked Sendable {
    static let schema = "generation_jobs"

    @ID(key: .id) var id: UUID?
    @Parent(key: "user_id") var user: User
    @Field(key: "kind") var kind: String
    @Field(key: "title") var title: String
    @Field(key: "status") var status: String
    @Field(key: "progress") var progress: Double
    @OptionalField(key: "provider_id") var providerID: String?
    @OptionalField(key: "result_asset_url") var resultAssetURL: String?
    @OptionalField(key: "error_message") var errorMessage: String?
    @Timestamp(key: "created_at", on: .create) var createdAt: Date?
    @Timestamp(key: "updated_at", on: .update) var updatedAt: Date?

    init() {}

    init(
        id: UUID? = nil,
        userID: User.IDValue,
        kind: String,
        title: String,
        status: String = "queued",
        progress: Double = 0,
        providerID: String? = nil
    ) {
        self.id = id
        self.$user.id = userID
        self.kind = kind
        self.title = title
        self.status = status
        self.progress = progress
        self.providerID = providerID
    }
}

struct JobDTO: Content {
    let id: UUID
    let kind: String
    let title: String
    let status: String
    let progress: Double
    let resultAssetURL: String?
    let errorMessage: String?
}

extension GenerationJobRecord {
    func asDTO() throws -> JobDTO {
        JobDTO(
            id: try requireID(),
            kind: kind,
            title: title,
            status: status,
            progress: progress,
            resultAssetURL: resultAssetURL,
            errorMessage: errorMessage
        )
    }
}
