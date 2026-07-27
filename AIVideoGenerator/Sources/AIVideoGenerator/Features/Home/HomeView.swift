import SwiftUI

struct HomeView: View {
    @Environment(DependencyContainer.self) private var container
    @State private var viewModel: HomeViewModel?
    @State private var showingVideoGenerator = false
    @State private var showingThumbnailGenerator = false
    @State private var showingEditor = false
    @State private var selectedTemplate: PromptTemplate?

    var body: some View {
        NavigationStack {
            ScrollView {
                if let viewModel {
                    content(viewModel: viewModel)
                } else {
                    ProgressView().padding(.top, Spacing.xxl)
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("AI Video Generator")
            .task {
                if viewModel == nil {
                    let model = HomeViewModel(projectStore: container.projectStore, queueManager: container.queueManager)
                    viewModel = model
                    await model.load()
                }
            }
            .refreshable { await viewModel?.load() }
            .sheet(isPresented: $showingVideoGenerator) {
                VideoGeneratorView()
            }
            .sheet(item: $selectedTemplate) { template in
                VideoGeneratorView(initialTemplate: template)
            }
            .sheet(isPresented: $showingThumbnailGenerator) {
                ThumbnailGeneratorView()
            }
            .sheet(isPresented: $showingEditor) {
                EditorLaunchView()
            }
        }
    }

    @ViewBuilder
    private func content(viewModel: HomeViewModel) -> some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            heroCards

            if !viewModel.activeJobs.isEmpty {
                GenerationQueueSection(jobs: viewModel.activeJobs)
            }

            TrendingStylesSection(styles: viewModel.trendingStyles)

            TemplatesSection(templates: viewModel.templates) { template in
                selectedTemplate = template
            }

            QuickActionsGrid { showingEditor = true }

            if !viewModel.favoriteProjects.isEmpty {
                RecentProjectsSection(
                    title: "Favorites",
                    projects: viewModel.favoriteProjects,
                    onToggleFavorite: { project in Task { await viewModel.toggleFavorite(project) } }
                )
            }

            RecentProjectsSection(
                title: "Recent Projects",
                projects: viewModel.recentProjects,
                onToggleFavorite: { project in Task { await viewModel.toggleFavorite(project) } }
            )

            StorageUsageCard(usedFraction: viewModel.storageFraction, usedBytes: viewModel.storageUsedBytes, limitBytes: viewModel.storageLimitBytes)
        }
        .padding(Spacing.md)
    }

    private var heroCards: some View {
        VStack(spacing: Spacing.md) {
            HeroActionCard(
                title: "Create Video",
                subtitle: "Turn a text prompt into a cinematic AI-generated video.",
                systemImage: "video.badge.waveform",
                gradient: Theme.brandGradient
            ) {
                showingVideoGenerator = true
            }

            HeroActionCard(
                title: "Create Thumbnail",
                subtitle: "Generate a scroll-stopping thumbnail in seconds.",
                systemImage: "photo.badge.plus",
                gradient: LinearGradient(colors: [Color(hex: 0xFF6B6B), Color(hex: 0xFFA502)], startPoint: .topLeading, endPoint: .bottomTrailing)
            ) {
                showingThumbnailGenerator = true
            }
        }
    }
}

#Preview {
    HomeView()
        .environment(DependencyContainer.preview())
}
