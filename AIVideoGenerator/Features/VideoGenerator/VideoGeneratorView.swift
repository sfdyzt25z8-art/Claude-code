import SwiftUI

struct VideoGeneratorView: View {
    @StateObject private var viewModel: VideoGeneratorViewModel
    @State private var showingPromptAssistant = false

    init(viewModel: VideoGeneratorViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.large) {
                    promptSection

                    section("Style") {
                        StyleSelectorView(selectedStyle: $viewModel.request.style)
                            .padding(.horizontal, Theme.Spacing.medium)
                    }

                    if let job = viewModel.activeJob {
                        GenerationProgressView(job: job)
                            .glassCard()
                            .padding(.horizontal, Theme.Spacing.medium)
                    }

                    DurationPickerView(
                        duration: $viewModel.request.duration,
                        estimatedCompletionText: viewModel.estimatedCompletionText,
                        allowsLongForm: true
                    )

                    VideoOptionsPanel(
                        resolution: $viewModel.request.resolution,
                        frameRate: $viewModel.request.frameRate,
                        aspectRatio: $viewModel.request.aspectRatio
                    )

                    CameraControlPickerView(selected: viewModel.request.cameraMovements) { movement in
                        viewModel.toggleCameraMovement(movement)
                    }
                    .padding(.horizontal, Theme.Spacing.medium)

                    LightingPickerView(selected: $viewModel.request.lighting)
                        .padding(.horizontal, Theme.Spacing.medium)

                    PrimaryButton(
                        title: viewModel.activeJob != nil ? "Generate Again" : "Generate Video",
                        systemImage: "sparkles",
                        isLoading: viewModel.isSubmitting
                    ) {
                        viewModel.submit()
                    }
                    .padding(.horizontal, Theme.Spacing.medium)
                    .padding(.bottom, Theme.Spacing.large)
                }
                .padding(.top, Theme.Spacing.small)
            }
        }
        .navigationTitle("Create Video")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingPromptAssistant = true
                } label: {
                    Image(systemName: "wand.and.stars")
                }
            }
        }
        .sheet(isPresented: $showingPromptAssistant) {
            PromptAssistantSheet(viewModel: viewModel)
        }
        .toast($viewModel.toast)
    }

    private var promptSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text("Describe Your Video")
                .font(.AIVG.bodyEmphasized)

            TextEditor(text: $viewModel.request.prompt)
                .frame(minHeight: 110)
                .scrollContentBackground(.hidden)
                .overlay(alignment: .topLeading) {
                    if viewModel.request.prompt.isEmpty {
                        Text("A futuristic cyberpunk city at night with flying cars and cinematic lighting…")
                            .font(.AIVG.body)
                            .foregroundStyle(Theme.Colors.textTertiary)
                            .padding(.top, 8)
                            .padding(.leading, 5)
                            .allowsHitTesting(false)
                    }
                }
                .padding(Theme.Spacing.small)
                .glassCard(padding: 0)

            Button {
                showingPromptAssistant = true
            } label: {
                Label("AI Prompt Assistant", systemImage: "wand.and.stars")
                    .font(.AIVG.subheadline)
            }
        }
        .padding(.horizontal, Theme.Spacing.medium)
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text(title)
                .font(.AIVG.bodyEmphasized)
                .padding(.horizontal, Theme.Spacing.medium)
            content()
        }
    }
}
