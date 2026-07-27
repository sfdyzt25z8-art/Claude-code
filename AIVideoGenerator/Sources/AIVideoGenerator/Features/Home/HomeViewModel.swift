import Foundation
import Observation

/// Drives the Home dashboard: recent/favorite projects, trending styles, quick
/// actions, storage usage, and the live generation queue. Reads from
/// `ProjectStoring` and `GenerationQueueManaging` through the `DependencyContainer`
/// so the view stays a thin rendering layer.
@MainActor
@Observable
final class HomeViewModel {
    private(set) var recentProjects: [VideoProject] = []
    private(set) var favoriteProjects: [VideoProject] = []
    private(set) var storageUsedBytes: Int64 = 0
    private(set) var storageLimitBytes: Int64 = 20 * 1_000 * 1_000 * 1_000
    private(set) var isLoading = false
    var lastError: AppError?

    let trendingStyles: [VideoStyle] = [.cinematic, .anime, .photorealistic, .fantasy, .sciFi, .pixar]
    let templates: [PromptTemplate] = PromptTemplate.defaults

    private let projectStore: ProjectStoring
    let queueManager: GenerationQueueManaging

    init(projectStore: ProjectStoring, queueManager: GenerationQueueManaging) {
        self.projectStore = projectStore
        self.queueManager = queueManager
    }

    var storageFraction: Double {
        guard storageLimitBytes > 0 else { return 0 }
        return min(Double(storageUsedBytes) / Double(storageLimitBytes), 1)
    }

    var activeJobs: [GenerationJob] {
        queueManager.jobs.filter { !$0.status.isTerminal }
    }

    var completedJobs: [GenerationJob] {
        queueManager.jobs.filter { $0.status.isTerminal }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let all = try await projectStore.fetchAll()
            recentProjects = Array(all.sorted { $0.updatedAt > $1.updatedAt }.prefix(10))
            favoriteProjects = all.filter(\.isFavorite)
            // Placeholder until assets are stored on-device with real file sizes;
            // estimates ~1.5MB/sec of footage at the project's resolution.
            storageUsedBytes = all.reduce(0) { $0 + Int64($1.duration * 1_500_000 * $1.resolution.costMultiplier) }
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }

    func toggleFavorite(_ project: VideoProject) async {
        do {
            try await projectStore.toggleFavorite(id: project.id)
            await load()
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }
}

/// A curated starting point for the prompt field, shown in the Templates section.
struct PromptTemplate: Identifiable, Sendable {
    let id = UUID()
    let title: String
    let prompt: String
    let style: VideoStyle
    let symbolName: String

    static let defaults: [PromptTemplate] = [
        PromptTemplate(
            title: "Cyberpunk City",
            prompt: "A futuristic cyberpunk city at night with flying cars and cinematic lighting.",
            style: .sciFi,
            symbolName: "building.2.crop.circle"
        ),
        PromptTemplate(
            title: "Product Launch",
            prompt: "A sleek product reveal on a minimalist studio stage with dramatic spotlighting.",
            style: .commercial,
            symbolName: "shippingbox"
        ),
        PromptTemplate(
            title: "Nature Documentary",
            prompt: "A sweeping aerial shot over a misty rainforest at sunrise, teeming with wildlife.",
            style: .documentary,
            symbolName: "leaf"
        ),
        PromptTemplate(
            title: "Fantasy Adventure",
            prompt: "An epic fantasy landscape with floating islands, waterfalls, and a dragon soaring overhead.",
            style: .fantasy,
            symbolName: "wand.and.stars"
        )
    ]
}
