import Foundation

@MainActor
final class ProjectsViewModel: ObservableObject {
    @Published private(set) var projects: [VideoProject] = []
    @Published var searchText: String = ""
    @Published var selectedFolder: String?
    @Published var showFavoritesOnly = false
    @Published var toast: Toast?

    private let projectStore: ProjectStoreProtocol

    init(projectStore: ProjectStoreProtocol) {
        self.projectStore = projectStore
    }

    var folders: [String] {
        Array(Set(projects.compactMap(\.folder))).sorted()
    }

    var filteredProjects: [VideoProject] {
        projects.filter { project in
            let matchesSearch = searchText.isEmpty
                || project.title.localizedCaseInsensitiveContains(searchText)
                || project.tags.contains { $0.localizedCaseInsensitiveContains(searchText) }
            let matchesFolder = selectedFolder == nil || project.folder == selectedFolder
            let matchesFavorite = !showFavoritesOnly || project.isFavorite
            return matchesSearch && matchesFolder && matchesFavorite
        }
    }

    func load() async {
        do {
            projects = try await projectStore.fetchAll()
        } catch {
            toast = Toast(message: "Couldn't load projects.", style: .error)
        }
    }

    func toggleFavorite(_ project: VideoProject) async {
        var updated = project
        updated.isFavorite.toggle()
        try? await projectStore.save(updated)
        await load()
    }

    func delete(_ project: VideoProject) async {
        try? await projectStore.delete(id: project.id)
        await load()
    }

    func rename(_ project: VideoProject, to newTitle: String) async {
        var updated = project
        updated.title = newTitle
        try? await projectStore.save(updated)
        await load()
    }

    func move(_ project: VideoProject, toFolder folder: String?) async {
        var updated = project
        updated.folder = folder
        try? await projectStore.save(updated)
        await load()
    }
}
