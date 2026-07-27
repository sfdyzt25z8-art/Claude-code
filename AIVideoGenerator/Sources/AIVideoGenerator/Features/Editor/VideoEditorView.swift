import SwiftUI
import AVKit

/// The full Video Editor screen: a live AVPlayer preview on top, the clip
/// timeline in the middle, and a horizontal tool row along the bottom. Every
/// tool opens as a sheet operating on the selected clip (or the whole
/// project, for PiP/titles/captions/export).
struct VideoEditorView: View {
    @Bindable var viewModel: VideoEditorViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var activeTool: EditorTool?

    enum EditorTool: String, Identifiable {
        case crop, speed, transition, color, effects, zoom, pip, titles, captions, sound, export
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                previewArea
                TimelineView(viewModel: viewModel)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.top, Spacing.sm)
                toolbar
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle(viewModel.project.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        activeTool = .export
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
            .sheet(item: $activeTool) { tool in
                toolSheet(for: tool)
                    .presentationDetents([.medium, .large])
            }
            .alert(
                "Something went wrong",
                isPresented: Binding(
                    get: { viewModel.lastError != nil },
                    set: { if !$0 { viewModel.lastError = nil } }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.lastError?.errorDescription ?? "")
            }
        }
    }

    private var previewArea: some View {
        Group {
            if let player = viewModel.player {
                VideoPlayer(player: player)
            } else {
                ZStack {
                    Color.black
                    if viewModel.isRebuildingPreview {
                        ProgressView().tint(.white)
                    } else {
                        Text("Add a clip to preview your video")
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
            }
        }
        .aspectRatio(viewModel.project.aspectRatio.ratio, contentMode: .fit)
        .frame(maxWidth: .infinity)
        .background(Color.black)
    }

    private var toolbar: some View {
        let hasSelectedClip = viewModel.selectedClip != nil
        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.lg) {
                toolButton("Split", "scissors", enabled: hasSelectedClip) {
                    viewModel.splitSelectedClip(atOffsetWithinClip: (viewModel.selectedClip?.trimmedSourceDuration ?? 0) / 2)
                }
                toolButton("Delete", "trash", enabled: hasSelectedClip) { viewModel.deleteSelectedClip() }
                toolButton("Crop/Rotate", "crop.rotate", enabled: hasSelectedClip) { activeTool = .crop }
                toolButton("Speed", "speedometer", enabled: hasSelectedClip) { activeTool = .speed }
                toolButton("Transition", "square.2.layers.3d", enabled: hasSelectedClip) { activeTool = .transition }
                toolButton("Color", "paintpalette", enabled: hasSelectedClip) { activeTool = .color }
                toolButton("Effects", "sparkles", enabled: hasSelectedClip) { activeTool = .effects }
                toolButton("Zoom", "arrow.up.left.and.arrow.down.right", enabled: hasSelectedClip) { activeTool = .zoom }
                toolButton("PiP", "rectangle.inset.bottomright.filled", enabled: true) { activeTool = .pip }
                toolButton("Titles", "textformat", enabled: true) { activeTool = .titles }
                toolButton("Captions", "captions.bubble", enabled: true) { activeTool = .captions }
                toolButton("Sound", "speaker.wave.2", enabled: true) { activeTool = .sound }
            }
            .padding(Spacing.md)
        }
        .background(Theme.secondaryBackground)
    }

    private func toolButton(_ title: String, _ symbol: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: Spacing.xxs) {
                Image(systemName: symbol).font(.system(size: 20))
                Text(title).font(Typography.caption)
            }
            .foregroundStyle(enabled ? Theme.primaryText : Theme.secondaryText)
        }
        .disabled(!enabled)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(title)
    }

    @ViewBuilder
    private func toolSheet(for tool: EditorTool) -> some View {
        switch tool {
        case .crop:
            if let clip = viewModel.selectedClip {
                CropRotatePanel(clip: clipBinding(default: clip))
            }
        case .speed:
            if let clip = viewModel.selectedClip {
                SpeedPanel(clip: clipBinding(default: clip))
            }
        case .transition:
            if let clip = viewModel.selectedClip, let index = viewModel.selectedClipIndex {
                TransitionPanel(clip: clipBinding(default: clip), isLastClip: index == viewModel.project.clips.count - 1)
            }
        case .color:
            if let clip = viewModel.selectedClip {
                ColorGradingPanel(clip: clipBinding(default: clip))
            }
        case .effects:
            if let clip = viewModel.selectedClip {
                EffectsPanel(clip: clipBinding(default: clip))
            }
        case .zoom:
            if let clip = viewModel.selectedClip {
                ZoomPanel(clip: clipBinding(default: clip))
            }
        case .pip:
            PiPPanel(viewModel: viewModel)
        case .titles:
            TitlesPanel(viewModel: viewModel)
        case .captions:
            CaptionsPanel(viewModel: viewModel)
        case .sound:
            SoundPanel(viewModel: viewModel)
        case .export:
            ExportPanel(viewModel: viewModel)
        }
    }

    private func clipBinding(default clip: EditorClip) -> Binding<EditorClip> {
        Binding(
            get: { viewModel.selectedClip ?? clip },
            set: { viewModel.selectedClip = $0 }
        )
    }
}
