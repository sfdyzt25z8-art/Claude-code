import Foundation

@MainActor
final class HomeViewModel: ObservableObject {
    @Published private(set) var recentProjects: [VideoProject] = []
    @Published private(set) var favoriteProjects: [VideoProject] = []
    @Published private(set) var storageUsage = StorageUsage(usedBytes: 0, quotaBytes: 5_000_000_000)
    @Published private(set) var isLoading = false
    @Published var toast: Toast?

    let templates: [VideoTemplate] = VideoTemplate.sampleTemplates
    let trendingStyles: [VideoStyle] = [.cinematic, .anime, .photorealistic, .fantasy, .threeD, .sciFi]

    private let projectStore: ProjectStoreProtocol
    private let storageUsageService: StorageUsageServiceProtocol

    init(projectStore: ProjectStoreProtocol, storageUsageService: StorageUsageServiceProtocol) {
        self.projectStore = projectStore
        self.storageUsageService = storageUsageService
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let all = try await projectStore.fetchAll()
            recentProjects = Array(all.prefix(8))
            favoriteProjects = all.filter(\.isFavorite)
        } catch {
            toast = Toast(message: "Couldn't load your projects.", style: .error)
        }

        storageUsage = await storageUsageService.currentUsage(quotaBytes: storageUsage.quotaBytes)
    }

    func toggleFavorite(_ project: VideoProject) async {
        var updated = project
        updated.isFavorite.toggle()
        try? await projectStore.save(updated)
        await load()
    }
}

extension VideoTemplate {
    static let sampleTemplates: [VideoTemplate] = [
        VideoTemplate(name: "Cyberpunk City", style: .sciFi, promptSeed: "A futuristic cyberpunk city at night with flying cars and neon reflections", isTrending: true),
        VideoTemplate(name: "Golden Hour Nature", style: .nature, promptSeed: "Sweeping drone shot over golden-hour mountains and mist", isTrending: true),
        VideoTemplate(name: "Anime Hero Reveal", style: .anime, promptSeed: "Dramatic anime hero reveal with wind-blown cape and cinematic lighting"),
        VideoTemplate(name: "Product Showcase", style: .commercial, promptSeed: "Sleek studio product showcase with volumetric lighting and slow rotation"),
        VideoTemplate(name: "Watercolor Story", style: .watercolor, promptSeed: "A gentle watercolor-style story of a boat sailing at sunset"),
        VideoTemplate(name: "Documentary Opener", style: .documentary, promptSeed: "Cinematic documentary opening shot of a bustling historic market")
    ]
}
