import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel: HomeViewModel
    @EnvironmentObject private var jobQueue: JobQueueService
    @EnvironmentObject private var promptAssistant: PromptAssistantService
    @EnvironmentObject private var providerRegistry: ProviderRegistry
    @EnvironmentObject private var appState: AppState
    private let projectStore: ProjectStoreProtocol

    @State private var seedRequest: VideoGenerationRequest?
    @State private var seedThumbnailRequest: ThumbnailRequest?

    init(viewModel: HomeViewModel, projectStore: ProjectStoreProtocol) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.projectStore = projectStore
    }

    private let quickActions: [QuickAction] = [
        QuickAction(title: "New Video", systemImage: "video.badge.plus", gradient: Theme.Gradients.brand),
        QuickAction(title: "Thumbnail", systemImage: "photo.badge.plus", gradient: Theme.Gradients.brandVertical),
        QuickAction(title: "Templates", systemImage: "square.grid.2x2", gradient: Theme.Gradients.brand),
        QuickAction(title: "Favorites", systemImage: "heart.fill", gradient: Theme.Gradients.brandVertical)
    ]

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.large) {
                    header

                    QuickActionsRow(actions: quickActions) { action in
                        handleQuickAction(action)
                    }

                    GenerationQueueCard(jobs: jobQueue.activeJobs) { job in
                        jobQueue.cancelJob(job.id)
                    }

                    RecentProjectsSection(projects: viewModel.recentProjects) { project in
                        Task { await viewModel.toggleFavorite(project) }
                    }

                    if !viewModel.favoriteProjects.isEmpty {
                        RecentProjectsSection(projects: viewModel.favoriteProjects) { project in
                            Task { await viewModel.toggleFavorite(project) }
                        }
                    }

                    TemplatesSection(templates: viewModel.templates) { template in
                        seedRequest = VideoGenerationRequest(prompt: template.promptSeed, style: template.style)
                    }

                    TrendingStylesSection(styles: viewModel.trendingStyles) { style in
                        seedRequest = VideoGenerationRequest(style: style)
                    }

                    StorageUsageCard(usage: viewModel.storageUsage)
                        .padding(.bottom, Theme.Spacing.large)
                }
                .padding(.top, Theme.Spacing.small)
            }
            .refreshable { await viewModel.load() }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: VideoProject.self) { project in
            ProjectDetailView(project: project, projectStore: projectStore)
        }
        .navigationDestination(item: $seedRequest) { request in
            VideoGeneratorView(viewModel: VideoGeneratorViewModel(
                initialRequest: request,
                jobQueue: jobQueue,
                promptAssistant: promptAssistant,
                defaultResolution: appState.defaultResolution,
                defaultFrameRate: appState.defaultFrameRate
            ))
        }
        .navigationDestination(item: $seedThumbnailRequest) { request in
            ThumbnailGeneratorView(viewModel: ThumbnailGeneratorViewModel(
                initialRequest: request,
                providerRegistry: providerRegistry,
                projectStore: projectStore
            ))
        }
        .toast($viewModel.toast)
        .task { await viewModel.load() }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(greeting)
                    .font(.AIVG.footnote)
                    .foregroundStyle(Theme.Colors.textSecondary)
                Text("AI Video Generator")
                    .font(.AIVG.largeTitle)
            }
            Spacer()
            Circle()
                .fill(Theme.Gradients.brand)
                .frame(width: 40, height: 40)
                .overlay(Image(systemName: "person.fill").foregroundStyle(.white))
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 0..<12: return "Good Morning"
        case 12..<18: return "Good Afternoon"
        default: return "Good Evening"
        }
    }

    private func handleQuickAction(_ action: QuickAction) {
        switch action.title {
        case "New Video": seedRequest = VideoGenerationRequest()
        case "Thumbnail": seedThumbnailRequest = ThumbnailRequest()
        default: break
        }
    }
}
