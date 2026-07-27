import SwiftUI

struct ProjectDetailView: View {
    @StateObject private var viewModel: ProjectDetailViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showingRename = false
    @State private var renameText = ""
    @State private var newTag = ""
    @State private var showingDeleteConfirmation = false
    @State private var showingEditor = false

    private let projectStore: ProjectStoreProtocol?

    init(project: VideoProject, projectStore: ProjectStoreProtocol? = nil) {
        _viewModel = StateObject(wrappedValue: ProjectDetailViewModel(project: project, projectStore: projectStore))
        self.projectStore = projectStore
    }

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.large) {
                    RoundedRectangle(cornerRadius: Theme.Radius.large, style: .continuous)
                        .fill(Theme.Gradients.brand)
                        .aspectRatio(16.0 / 9.0, contentMode: .fit)
                        .overlay {
                            Image(systemName: viewModel.project.kind == .video ? "play.circle.fill" : "photo.fill")
                                .font(.system(size: 44))
                                .foregroundStyle(.white)
                        }
                        .padding(.horizontal, Theme.Spacing.medium)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(viewModel.project.title)
                            .font(.AIVG.title2)
                        Text("Updated \(viewModel.project.updatedAt.formatted(date: .abbreviated, time: .shortened))")
                            .font(.AIVG.footnote)
                            .foregroundStyle(Theme.Colors.textSecondary)
                    }
                    .padding(.horizontal, Theme.Spacing.medium)

                    actionRow

                    tagsSection

                    if !viewModel.project.versionHistory.isEmpty {
                        versionHistorySection
                    }
                }
                .padding(.top, Theme.Spacing.small)
                .padding(.bottom, Theme.Spacing.large)
            }
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        renameText = viewModel.project.title
                        showingRename = true
                    } label: {
                        Label("Rename", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .alert("Rename Project", isPresented: $showingRename) {
            TextField("Title", text: $renameText)
            Button("Cancel", role: .cancel) {}
            Button("Save") { viewModel.rename(to: renameText) }
        }
        .confirmationDialog("Delete this project?", isPresented: $showingDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                Task {
                    await viewModel.delete()
                    dismiss()
                }
            }
        }
        .sheet(isPresented: $showingEditor) {
            NavigationStack {
                VideoEditorView(project: viewModel.project, projectStore: projectStore)
            }
        }
        .toast($viewModel.toast)
    }

    private var actionRow: some View {
        HStack(spacing: Theme.Spacing.small) {
            SecondaryButton(title: viewModel.project.isFavorite ? "Favorited" : "Favorite", systemImage: viewModel.project.isFavorite ? "heart.fill" : "heart") {
                viewModel.toggleFavorite()
            }
            if viewModel.project.kind == .video {
                SecondaryButton(title: "Edit", systemImage: "slider.horizontal.below.rectangle") {
                    showingEditor = true
                }
            }
            SecondaryButton(title: "Share", systemImage: "square.and.arrow.up") {
                // Production: present UIActivityViewController via ShareSheet with project.mediaURL
            }
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }

    private var tagsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text("Tags").font(.AIVG.bodyEmphasized)
            HStack {
                ForEach(viewModel.project.tags, id: \.self) { tag in
                    ChipView(label: tag, isSelected: false) { viewModel.removeTag(tag) }
                }
                TextField("Add tag", text: $newTag)
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 100)
                    .onSubmit {
                        viewModel.addTag(newTag)
                        newTag = ""
                    }
            }
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }

    private var versionHistorySection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text("Version History").font(.AIVG.bodyEmphasized)
            ForEach(viewModel.project.versionHistory.reversed()) { version in
                HStack {
                    Image(systemName: "clock.arrow.circlepath")
                        .foregroundStyle(Theme.Colors.textSecondary)
                    VStack(alignment: .leading) {
                        Text(version.note).font(.AIVG.footnote)
                        Text(version.savedAt, style: .relative).font(.AIVG.caption).foregroundStyle(Theme.Colors.textTertiary)
                    }
                }
            }
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }
}
