import Foundation

protocol ProjectStoreProtocol: Sendable {
    func fetchAll() async throws -> [VideoProject]
    func project(id: UUID) async throws -> VideoProject?
    func save(_ project: VideoProject) async throws
    func delete(id: UUID) async throws
}

/// File-backed local project store. Persists projects as a single JSON
/// document in the app's Documents directory, guarded by actor isolation so
/// concurrent saves from the job queue never corrupt the file.
///
/// This is intentionally simple for the local-first MVP; cloud sync (the
/// Settings → "Cloud synchronization" requirement) layers on top by
/// diffing this store against a remote collection and is a natural next
/// milestone once a backend is connected.
actor LocalProjectStore: ProjectStoreProtocol {
    private let fileURL: URL
    private var cache: [UUID: VideoProject]?

    init(fileManager: FileManager = .default) {
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.fileURL = documents.appendingPathComponent("projects.json")
    }

    func fetchAll() async throws -> [VideoProject] {
        try loadIfNeeded()
        return (cache ?? [:]).values.sorted { $0.updatedAt > $1.updatedAt }
    }

    func project(id: UUID) async throws -> VideoProject? {
        try loadIfNeeded()
        return cache?[id]
    }

    func save(_ project: VideoProject) async throws {
        try loadIfNeeded()
        var project = project
        project.updatedAt = .now
        cache?[project.id] = project
        try persist()
    }

    func delete(id: UUID) async throws {
        try loadIfNeeded()
        cache?[id] = nil
        try persist()
    }

    private func loadIfNeeded() throws {
        guard cache == nil else { return }
        guard let data = try? Data(contentsOf: fileURL) else {
            cache = [:]
            return
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let projects = (try? decoder.decode([VideoProject].self, from: data)) ?? []
        cache = Dictionary(uniqueKeysWithValues: projects.map { ($0.id, $0) })
    }

    private func persist() throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]
        let data = try encoder.encode(Array((cache ?? [:]).values))
        try data.write(to: fileURL, options: .atomic)
    }
}
