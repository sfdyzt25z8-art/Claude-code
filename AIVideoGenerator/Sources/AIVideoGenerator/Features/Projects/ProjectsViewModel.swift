import Foundation
import Observation

/// Backs the project library: search, folder/tag filtering, and favoriting.
/// Cloud sync and version history are exposed through `VideoProject` itself and
/// `ProjectStoring`; this view model only handles presentation-side filtering.
@MainActor
@Observable
final class ProjectsViewModel {
    private(set) var allProjects: [VideoProject] = []
    var searchText: String = ""
    var selectedFolder: String? = nil
    var showFavoritesOnly = false
    var lastError: AppError?

    private let projectStore: ProjectStoring

    init(projectStore: ProjectStoring) {
        self.projectStore = projectStore
    }

    var folders: [String] {
        Array(Set(allProjects.compactMap(\.folder))).sorted()
    }

    var filteredProjects: [VideoProject] {
        allProjects
            .filter { showFavoritesOnly ? $0.isFavorite : true }
            .filter { selectedFolder == nil || $0.folder == selectedFolder }
            .filter { searchText.isEmpty || $0.name.localizedCaseInsensitiveContains(searchText) || $0.tags.contains { $0.localizedCaseInsensitiveContains(searchText) } }
            .sorted { $0.updatedAt > $1.updatedAt }
    }

    func load() async {
        do {
            allProjects = try await projectStore.fetchAll()
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

    func delete(_ project: VideoProject) async {
        do {
            try await projectStore.delete(id: project.id)
            await load()
        } catch {
            lastError = error as? AppError ?? .unknown
        }
    }
}
