import XCTest
@testable import AIVideoGenerator

@MainActor
final class ProjectsViewModelTests: XCTestCase {
    func testFilteredProjectsRespectsSearchFolderAndFavorites() async throws {
        let store = InMemoryProjectStore()
        let cityscape = VideoProject(title: "Neon Cityscape", kind: .video, isFavorite: true, folder: "Sci-Fi", tags: ["cyberpunk"])
        let sunset = VideoProject(title: "Beach Sunset", kind: .video, isFavorite: false, folder: "Nature")
        try await store.save(cityscape)
        try await store.save(sunset)

        let viewModel = ProjectsViewModel(projectStore: store)
        await viewModel.load()
        XCTAssertEqual(viewModel.projects.count, 2)

        viewModel.searchText = "cyberpunk"
        XCTAssertEqual(viewModel.filteredProjects.map(\.title), ["Neon Cityscape"])

        viewModel.searchText = ""
        viewModel.selectedFolder = "Nature"
        XCTAssertEqual(viewModel.filteredProjects.map(\.title), ["Beach Sunset"])

        viewModel.selectedFolder = nil
        viewModel.showFavoritesOnly = true
        XCTAssertEqual(viewModel.filteredProjects.map(\.title), ["Neon Cityscape"])
    }

    func testToggleFavoritePersists() async throws {
        let store = InMemoryProjectStore()
        let project = VideoProject(title: "Mountain Timelapse", kind: .video, isFavorite: false)
        try await store.save(project)

        let viewModel = ProjectsViewModel(projectStore: store)
        await viewModel.load()
        await viewModel.toggleFavorite(project)

        let updated = try await store.project(id: project.id)
        XCTAssertEqual(updated?.isFavorite, true)
    }

    func testDeleteRemovesProject() async throws {
        let store = InMemoryProjectStore()
        let project = VideoProject(title: "Old Draft", kind: .video)
        try await store.save(project)

        let viewModel = ProjectsViewModel(projectStore: store)
        await viewModel.load()
        await viewModel.delete(project)

        let remaining = try await store.fetchAll()
        XCTAssertTrue(remaining.isEmpty)
    }
}
