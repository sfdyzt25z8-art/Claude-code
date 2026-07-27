import Foundation

@MainActor
final class ProjectDetailViewModel: ObservableObject {
    @Published var project: VideoProject
    @Published var toast: Toast?
    @Published private(set) var isDeleted = false

    private let projectStore: ProjectStoreProtocol?

    init(project: VideoProject, projectStore: ProjectStoreProtocol?) {
        self.project = project
        self.projectStore = projectStore
    }

    func toggleFavorite() {
        project.isFavorite.toggle()
        persist()
    }

    func rename(to newTitle: String) {
        guard !newTitle.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        project.title = newTitle
        persist()
    }

    func addTag(_ tag: String) {
        guard !tag.isEmpty, !project.tags.contains(tag) else { return }
        project.tags.append(tag)
        persist()
    }

    func removeTag(_ tag: String) {
        project.tags.removeAll { $0 == tag }
        persist()
    }

    func delete() async {
        guard let projectStore else { return }
        try? await projectStore.delete(id: project.id)
        isDeleted = true
    }

    private func persist() {
        guard let projectStore else { return }
        let snapshot = project
        Task { try? await projectStore.save(snapshot) }
    }
}
