import SwiftUI
import PhotosUI
import AVFoundation

/// Entry point for the Video Editor: lets the user pick a real video from
/// their Photos library (there's no "generate then edit" pipeline yet — see
/// docs/ARCHITECTURE.md), then hands off to `VideoEditorView` once it's
/// imported and its duration is known.
struct EditorLaunchView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var isLoading = false
    @State private var editorProject: EditorProject?
    @State private var loadError: AppError?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if let editorProject {
            VideoEditorView(viewModel: VideoEditorViewModel(project: editorProject))
        } else {
            NavigationStack {
                VStack(spacing: Spacing.lg) {
                    Spacer()
                    Image(systemName: "video.badge.plus")
                        .font(.system(size: 48))
                        .foregroundStyle(Theme.brandGradient)
                    Text("Choose a video to edit")
                        .font(Typography.title)
                        .foregroundStyle(Theme.primaryText)
                    Text("Trim, crop, add titles and captions, grade color, and export.")
                        .font(Typography.subheadline)
                        .foregroundStyle(Theme.secondaryText)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.xl)

                    if isLoading {
                        ProgressView("Importing…")
                    } else {
                        PhotosPicker(selection: $selectedItem, matching: .videos) {
                            Label("Choose Video", systemImage: "photo.on.rectangle")
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    Spacer()
                }
                .padding(Spacing.lg)
                .background(Theme.background.ignoresSafeArea())
                .navigationTitle("Video Editor")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { dismiss() }
                    }
                }
                .task(id: selectedItem) {
                    await loadSelectedVideo()
                }
                .alert(
                    "Couldn't Import Video",
                    isPresented: Binding(get: { loadError != nil }, set: { if !$0 { loadError = nil } })
                ) {
                    Button("OK", role: .cancel) {}
                } message: {
                    Text(loadError?.errorDescription ?? "")
                }
            }
        }
    }

    private func loadSelectedVideo() async {
        guard let selectedItem else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            guard let movie = try await selectedItem.loadTransferable(type: VideoFileTransfer.self) else {
                loadError = .storage("That file couldn't be read as a video.")
                return
            }
            let asset = AVURLAsset(url: movie.url)
            let duration = try await asset.load(.duration)
            let clip = EditorClip(sourceURL: movie.url, sourceTrimEnd: CMTimeGetSeconds(duration))
            editorProject = EditorProject(name: "New Project", clips: [clip])
        } catch {
            loadError = .storage("Couldn't import that video: \(error.localizedDescription)")
        }
    }
}
