import Foundation

@MainActor
final class ThumbnailGeneratorViewModel: ObservableObject {
    @Published var request: ThumbnailRequest
    @Published private(set) var results: [ThumbnailResult] = []
    @Published private(set) var isGenerating = false
    @Published private(set) var savedProjectID: UUID?
    @Published var toast: Toast?

    private let providerRegistry: ProviderRegistry
    private let projectStore: ProjectStoreProtocol

    init(initialRequest: ThumbnailRequest = ThumbnailRequest(), providerRegistry: ProviderRegistry, projectStore: ProjectStoreProtocol) {
        self.request = initialRequest
        self.providerRegistry = providerRegistry
        self.projectStore = projectStore
    }

    func generate() async {
        guard request.isValid else {
            toast = Toast(message: "Describe the thumbnail you want to generate.", style: .error)
            return
        }
        guard let provider = providerRegistry.activeThumbnailProvider else {
            toast = Toast(message: "No thumbnail provider is configured.", style: .error)
            return
        }

        isGenerating = true
        defer { isGenerating = false }

        do {
            results = try await provider.generateThumbnails(for: request, count: 4)
        } catch {
            toast = Toast(message: error.localizedDescription, style: .error)
        }
    }

    func save(_ result: ThumbnailResult) async {
        let project = VideoProject(
            title: request.titleText.isEmpty ? request.prompt : request.titleText,
            kind: .thumbnail,
            thumbnailURL: result.imageURL
        )
        do {
            try await projectStore.save(project)
            savedProjectID = project.id
            toast = Toast(message: "Saved to your projects.", style: .success)
        } catch {
            toast = Toast(message: "Couldn't save thumbnail.", style: .error)
        }
    }
}
