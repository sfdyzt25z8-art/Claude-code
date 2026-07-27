import SwiftUI

struct ExportSheet: View {
    @ObservedObject var viewModel: VideoEditorViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showingShareSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                AuroraBackground()
                VStack(spacing: Theme.Spacing.large) {
                    VStack(alignment: .leading, spacing: Theme.Spacing.medium) {
                        optionRow("Format") {
                            SegmentedPicker(options: ExportFormat.allCases, selection: $viewModel.exportFormat) { $0.displayName }
                        }
                        optionRow("Resolution") {
                            SegmentedPicker(options: VideoResolution.allCases, selection: $viewModel.exportResolution) { $0.displayName }
                        }
                        optionRow("Frame Rate") {
                            SegmentedPicker(options: VideoFrameRate.allCases, selection: $viewModel.exportFrameRate) { $0.displayName }
                        }
                        optionRow("Bitrate") {
                            ChipSelector(options: ExportBitrate.allCases, selection: $viewModel.exportBitrate) { $0.displayName }
                        }
                    }
                    .padding(.horizontal, Theme.Spacing.medium)

                    if viewModel.isExporting {
                        ProgressRing(progress: viewModel.exportProgress, size: 72)
                        Text("Exporting…").font(.AIVG.subheadline)
                    } else if let url = viewModel.exportedFileURL {
                        VStack(spacing: Theme.Spacing.small) {
                            Label("Export Ready", systemImage: "checkmark.circle.fill")
                                .foregroundStyle(Theme.Colors.success)
                            HStack(spacing: Theme.Spacing.small) {
                                SecondaryButton(title: "Save to Photos", systemImage: "square.and.arrow.down") {
                                    // Production: PHPhotoLibrary.shared().performChanges { ... }
                                }
                                SecondaryButton(title: "Share", systemImage: "square.and.arrow.up") {
                                    showingShareSheet = true
                                }
                            }
                        }
                        .sheet(isPresented: $showingShareSheet) {
                            ShareSheet(items: [url])
                        }
                    }

                    Spacer()

                    PrimaryButton(title: "Export", systemImage: "square.and.arrow.up", isLoading: viewModel.isExporting) {
                        Task { await viewModel.export() }
                    }
                    .padding(.horizontal, Theme.Spacing.medium)
                    .padding(.bottom, Theme.Spacing.medium)
                }
                .padding(.top, Theme.Spacing.large)
            }
            .navigationTitle("Export")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private func optionRow<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text(title).font(.AIVG.bodyEmphasized)
            content()
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
