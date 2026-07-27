import SwiftUI

struct ProjectsListView: View {
    @StateObject private var viewModel: ProjectsViewModel
    private let projectStore: ProjectStoreProtocol

    init(viewModel: ProjectsViewModel, projectStore: ProjectStoreProtocol) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.projectStore = projectStore
    }

    var body: some View {
        ZStack {
            AuroraBackground()

            if viewModel.filteredProjects.isEmpty {
                EmptyStateView(
                    systemImage: "folder",
                    title: "No Projects",
                    message: viewModel.searchText.isEmpty ? "Generate a video or thumbnail to see it here." : "No projects match your search."
                )
            } else {
                List {
                    if !viewModel.folders.isEmpty {
                        Section {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: Theme.Spacing.xSmall) {
                                    folderChip(nil, label: "All")
                                    ForEach(viewModel.folders, id: \.self) { folder in
                                        folderChip(folder, label: folder)
                                    }
                                }
                            }
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                        }
                    }

                    Section {
                        ForEach(viewModel.filteredProjects) { project in
                            NavigationLink(value: project) {
                                ProjectRow(project: project) {
                                    Task { await viewModel.toggleFavorite(project) }
                                }
                            }
                        }
                        .onDelete { indexSet in
                            for index in indexSet {
                                Task { await viewModel.delete(viewModel.filteredProjects[index]) }
                            }
                        }
                    }
                    .listRowBackground(Color.clear)
                }
                .scrollContentBackground(.hidden)
                .listStyle(.plain)
            }
        }
        .navigationTitle("Projects")
        .navigationDestination(for: VideoProject.self) { project in
            ProjectDetailView(project: project, projectStore: projectStore)
        }
        .searchable(text: $viewModel.searchText, prompt: "Search projects or tags")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    viewModel.showFavoritesOnly.toggle()
                } label: {
                    Image(systemName: viewModel.showFavoritesOnly ? "heart.fill" : "heart")
                }
            }
        }
        .toast($viewModel.toast)
        .task { await viewModel.load() }
    }

    private func folderChip(_ folder: String?, label: String) -> some View {
        ChipView(label: label, isSelected: viewModel.selectedFolder == folder) {
            viewModel.selectedFolder = folder
        }
        .padding(.leading, folder == nil ? Theme.Spacing.medium : 0)
    }
}
