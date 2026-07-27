import Foundation

/// Persists `VideoProject`s locally (and, when signed in, syncs them to the cloud).
/// The queue manager and Home dashboard both depend only on this protocol, so the
/// on-disk format or future SwiftData/CloudKit backing can change without touching them.
protocol ProjectStoring: Sendable {
    func save(_ project: VideoProject) async throws
    func delete(id: VideoProject.ID) async throws
    func fetchAll() async throws -> [VideoProject]
    func toggleFavorite(id: VideoProject.ID) async throws
}

/// A `FileManager`/JSON-backed local store. Every write re-serializes the whole
/// index, which is more than adequate for the hundreds (not millions) of projects
/// a single user is expected to accumulate; a heavier per-user library would move
/// this to SwiftData without changing the `ProjectStoring` contract.
actor LocalProjectStore: ProjectStoring {
    private let fileURL: URL
    private var cache: [VideoProject]?

    init(directory: URL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]) {
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        self.fileURL = directory.appendingPathComponent("projects.json")
    }

    func save(_ project: VideoProject) async throws {
        var projects = try await loadFromDisk()
        if let index = projects.firstIndex(where: { $0.id == project.id }) {
            var updated = project
            updated.updatedAt = .now
            projects[index] = updated
        } else {
            projects.insert(project, at: 0)
        }
        try persist(projects)
    }

    func delete(id: VideoProject.ID) async throws {
        var projects = try await loadFromDisk()
        projects.removeAll { $0.id == id }
        try persist(projects)
    }

    func fetchAll() async throws -> [VideoProject] {
        try await loadFromDisk()
    }

    func toggleFavorite(id: VideoProject.ID) async throws {
        var projects = try await loadFromDisk()
        guard let index = projects.firstIndex(where: { $0.id == id }) else {
            throw AppError.storage("Project not found.")
        }
        projects[index].isFavorite.toggle()
        projects[index].updatedAt = .now
        try persist(projects)
    }

    private func loadFromDisk() async throws -> [VideoProject] {
        if let cache { return cache }
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            cache = []
            return []
        }
        do {
            let data = try Data(contentsOf: fileURL)
            let projects = try JSONDecoder.api.decode([VideoProject].self, from: data)
            cache = projects
            return projects
        } catch {
            throw AppError.storage("Couldn't read your saved projects.")
        }
    }

    private func persist(_ projects: [VideoProject]) throws {
        do {
            let data = try JSONEncoder.api.encode(projects)
            try data.write(to: fileURL, options: .atomic)
            cache = projects
        } catch {
            throw AppError.storage("Couldn't save your project.")
        }
    }
}
