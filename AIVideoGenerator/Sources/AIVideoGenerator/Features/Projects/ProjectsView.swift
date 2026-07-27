import SwiftUI

/// Full project library: search, folder filter, favorites toggle, and swipe
/// actions for favorite/delete. Cloud sync status is reflected via
/// `SubscriptionPlan.cloudSyncEnabled` in a future iteration; today this reads
/// purely from the local `ProjectStoring` cache.
struct ProjectsView: View {
    @Environment(DependencyContainer.self) private var container
    @State private var viewModel: ProjectsViewModel?

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    List {
                        if !viewModel.folders.isEmpty {
                            Picker("Folder", selection: Binding(
                                get: { viewModel.selectedFolder },
                                set: { viewModel.selectedFolder = $0 }
                            )) {
                                Text("All Folders").tag(String?.none)
                                ForEach(viewModel.folders, id: \.self) { folder in
                                    Text(folder).tag(String?.some(folder))
                                }
                            }
                        }

                        ForEach(viewModel.filteredProjects) { project in
                            HStack(spacing: Spacing.sm) {
                                ShimmerPlaceholder(cornerRadius: Theme.Radius.small)
                                    .frame(width: 64, height: 40)

                                VStack(alignment: .leading, spacing: Spacing.xxs) {
                                    Text(project.name).font(Typography.subheadline).lineLimit(1)
                                    Text("\(project.style.displayName) · \(project.resolution.rawValue)")
                                        .font(Typography.caption)
                                        .foregroundStyle(Theme.secondaryText)
                                }

                                Spacer()

                                if project.isFavorite {
                                    Image(systemName: "heart.fill").foregroundStyle(Theme.danger)
                                }
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    Task { await viewModel.delete(project) }
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                                Button {
                                    Task { await viewModel.toggleFavorite(project) }
                                } label: {
                                    Label("Favorite", systemImage: "heart")
                                }
                                .tint(Theme.danger)
                            }
                        }
                    }
                    .searchable(text: Binding(get: { viewModel.searchText }, set: { viewModel.searchText = $0 }), prompt: "Search projects or tags")
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button {
                                viewModel.showFavoritesOnly.toggle()
                            } label: {
                                Image(systemName: viewModel.showFavoritesOnly ? "heart.fill" : "heart")
                            }
                        }
                    }
                    .refreshable { await viewModel.load() }
                    .overlay {
                        if viewModel.filteredProjects.isEmpty {
                            ContentUnavailableView("No Projects Yet", systemImage: "film.stack", description: Text("Your generated videos and thumbnails will appear here."))
                        }
                    }
                } else {
                    ProgressView()
                }
            }
            .navigationTitle("Projects")
            .task {
                if viewModel == nil {
                    let model = ProjectsViewModel(projectStore: container.projectStore)
                    viewModel = model
                    await model.load()
                }
            }
        }
    }
}

#Preview {
    ProjectsView()
        .environment(DependencyContainer.preview())
}
