import SwiftUI

struct VideoEditorView: View {
    @StateObject private var viewModel: VideoEditorViewModel
    @State private var activeTool: EditorTool?
    @State private var showingExportSheet = false

    init(project: VideoProject?, projectStore: ProjectStoreProtocol? = nil) {
        _viewModel = StateObject(wrappedValue: VideoEditorViewModel(project: project, projectStore: projectStore))
    }

    var body: some View {
        ZStack {
            AuroraBackground()

            if viewModel.clips.isEmpty {
                EmptyStateView(
                    systemImage: "film",
                    title: "No Project Loaded",
                    message: "Open a project from your library to start editing, or generate a new video first."
                )
            } else {
                VStack(spacing: 0) {
                    previewArea
                    Spacer()
                    if let activeTool, activeTool != .export {
                        EditorToolPanel(tool: activeTool, viewModel: viewModel)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                    TimelineView(
                        clips: viewModel.clips,
                        selectedClipID: $viewModel.selectedClipID,
                        playheadTime: $viewModel.playheadTime,
                        totalDuration: viewModel.totalDuration
                    )
                    EditorToolbarView { tool in
                        if tool == .export {
                            showingExportSheet = true
                        } else {
                            withAnimation(Theme.Animation.standard) {
                                activeTool = (activeTool == tool) ? nil : tool
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Editor")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Save") { Task { await viewModel.saveProjectSnapshot() } }
                    .disabled(viewModel.project == nil)
            }
        }
        .sheet(isPresented: $showingExportSheet) {
            ExportSheet(viewModel: viewModel)
        }
        .toast($viewModel.toast)
    }

    private var previewArea: some View {
        ZStack {
            RoundedRectangle(cornerRadius: Theme.Radius.large, style: .continuous)
                .fill(Color.black)
                .aspectRatio(16.0 / 9.0, contentMode: .fit)
                .overlay {
                    VStack(spacing: Theme.Spacing.xSmall) {
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(.white.opacity(0.85))
                        Text(String(format: "%.1fs / %.1fs", viewModel.playheadTime, viewModel.totalDuration))
                            .font(.AIVG.caption)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                .overlay(alignment: .bottom) {
                    if !viewModel.appliedEffects.isEmpty {
                        HStack(spacing: 4) {
                            ForEach(Array(viewModel.appliedEffects).prefix(5)) { effect in
                                Image(systemName: effect.systemImage)
                                    .font(.caption)
                                    .padding(6)
                                    .background(.black.opacity(0.4), in: Circle())
                                    .foregroundStyle(.white)
                            }
                        }
                        .padding(.bottom, Theme.Spacing.small)
                    }
                }
        }
        .padding(Theme.Spacing.medium)
    }
}
