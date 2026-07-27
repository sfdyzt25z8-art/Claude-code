import SwiftUI

/// Thumbnail creation flow: prompt entry plus a category picker that biases the
/// provider's layout, text-placement, and color-contrast suggestions.
struct ThumbnailGeneratorView: View {
    @Environment(DependencyContainer.self) private var container
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: ThumbnailGeneratorViewModel?

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
            .navigationTitle("Create Thumbnail")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .task {
                if viewModel == nil {
                    let providerID = container.providerRegistry.allThumbnailProviders().first?.id ?? "mock.thumbnails"
                    viewModel = ThumbnailGeneratorViewModel(queueManager: container.queueManager, providerID: providerID)
                }
            }
        }
    }

    @ViewBuilder
    private func form(viewModel: ThumbnailGeneratorViewModel) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    SectionHeader(title: "Describe your thumbnail")
                    GlassCard {
                        TextEditor(text: Binding(get: { viewModel.prompt }, set: { viewModel.prompt = $0 }))
                            .frame(minHeight: 90)
                            .scrollContentBackground(.hidden)
                            .font(Typography.body)
                    }
                }

                SingleSelectChipRow(
                    title: "Category",
                    options: ThumbnailCategory.allCases,
                    selection: Binding(get: { viewModel.category }, set: { viewModel.category = $0 }),
                    label: \.displayName,
                    systemImage: { $0.symbolName }
                )

                Text("We'll automatically suggest layout, text placement, and color contrast for your \(viewModel.category.displayName.lowercased()) thumbnail.")
                    .font(Typography.caption)
                    .foregroundStyle(Theme.secondaryText)

                PrimaryButton(
                    title: "Generate Thumbnail",
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
    ThumbnailGeneratorView()
        .environment(DependencyContainer.preview())
}
