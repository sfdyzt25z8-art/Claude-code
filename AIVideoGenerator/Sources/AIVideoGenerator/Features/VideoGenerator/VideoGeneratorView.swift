import SwiftUI

/// The full AI Video Generator creation flow: prompt + AI assistant, style,
/// resolution/FPS/aspect ratio, duration (with automatic scene-stitching for
/// long requests), camera movement, and lighting — ending in a single
/// full-width "Generate Video" action.
struct VideoGeneratorView: View {
    @Environment(DependencyContainer.self) private var container
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: VideoGeneratorViewModel?
    var initialTemplate: PromptTemplate? = nil

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    if let job = viewModel.submittedJob {
                        GenerationProgressView(job: job, onDone: { dismiss() })
                    } else {
                        form(viewModel: viewModel)
                    }
                } else {
                    ProgressView()
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Create Video")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .task {
                if viewModel == nil {
                    let model = VideoGeneratorViewModel(
                        queueManager: container.queueManager,
                        promptAssistant: container.promptAssistant,
                        availableProviders: container.providerRegistry.allVideoProviders()
                    )
                    if let initialTemplate {
                        model.applyTemplate(initialTemplate)
                    }
                    viewModel = model
                }
            }
            .alert(
                "Something went wrong",
                isPresented: Binding(
                    get: { viewModel?.lastError != nil },
                    set: { if !$0 { viewModel?.lastError = nil } }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel?.lastError?.errorDescription ?? "")
            }
        }
    }

    @ViewBuilder
    private func form(viewModel: VideoGeneratorViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                PromptInputView(
                    prompt: Binding(get: { viewModel.prompt }, set: { viewModel.prompt = $0 }),
                    isAssisting: viewModel.isAssisting,
                    onAction: { action in Task { await viewModel.applyPromptAssist(action) } },
                    onSuggest: { Task { await viewModel.requestSuggestions() } }
                )

                SingleSelectChipRow(
                    title: "Style",
                    options: VideoStyle.allCases,
                    selection: Binding(get: { viewModel.style }, set: { viewModel.style = $0 }),
                    label: \.displayName,
                    systemImage: { $0.symbolName }
                )

                DurationPickerView(
                    durationSeconds: Binding(get: { viewModel.durationSeconds }, set: { viewModel.durationSeconds = $0 }),
                    willRequireStitching: viewModel.willRequireSceneStitching,
                    estimatedCompletion: viewModel.estimatedCompletion
                )

                HStack(alignment: .top, spacing: Spacing.md) {
                    SingleSelectChipRow(
                        title: "Resolution",
                        options: VideoResolution.allCases,
                        selection: Binding(get: { viewModel.resolution }, set: { viewModel.resolution = $0 }),
                        label: \.rawValue
                    )
                    SingleSelectChipRow(
                        title: "Frame Rate",
                        options: FrameRate.allCases,
                        selection: Binding(get: { viewModel.frameRate }, set: { viewModel.frameRate = $0 }),
                        label: \.displayName
                    )
                }

                SingleSelectChipRow(
                    title: "Aspect Ratio",
                    options: VideoAspectRatio.allCases,
                    selection: Binding(get: { viewModel.aspectRatio }, set: { viewModel.aspectRatio = $0 }),
                    label: \.displayName
                )

                VStack(alignment: .leading, spacing: Spacing.sm) {
                    SectionHeader(title: "Camera Movement")
                    ChipSelector(
                        options: CameraMovement.allCases,
                        selection: Binding(
                            get: { Set(viewModel.selectedCameraMovements.map(\.id)) },
                            set: { ids in viewModel.selectedCameraMovements = Set(CameraMovement.allCases.filter { ids.contains($0.id) }) }
                        ),
                        label: \.displayName,
                        systemImage: { $0.symbolName }
                    )
                }

                VStack(alignment: .leading, spacing: Spacing.sm) {
                    SectionHeader(title: "Lighting")
                    ChipSelector(
                        options: LightingStyle.allCases,
                        selection: Binding(
                            get: { Set(viewModel.selectedLightingStyles.map(\.id)) },
                            set: { ids in viewModel.selectedLightingStyles = Set(LightingStyle.allCases.filter { ids.contains($0.id) }) }
                        ),
                        label: \.displayName,
                        systemImage: { $0.symbolName }
                    )
                }

                if let issue = viewModel.validationIssues.first {
                    Text(issue.message)
                        .font(Typography.caption)
                        .foregroundStyle(Theme.danger)
                }

                PrimaryButton(
                    title: "Generate Video",
                    systemImage: "sparkles",
                    isLoading: viewModel.isSubmitting,
                    isEnabled: viewModel.canSubmit
                ) {
                    Task { await viewModel.submit() }
                }
            }
            .padding(Spacing.md)
        }
    }
}

#Preview {
    VideoGeneratorView()
        .environment(DependencyContainer.preview())
}
