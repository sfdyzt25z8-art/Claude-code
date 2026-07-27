import SwiftUI

struct ThumbnailGeneratorView: View {
    @StateObject private var viewModel: ThumbnailGeneratorViewModel

    init(viewModel: ThumbnailGeneratorViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.large) {
                    VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                        Text("Describe Your Thumbnail")
                            .font(.AIVG.bodyEmphasized)
                        TextEditor(text: $viewModel.request.prompt)
                            .frame(minHeight: 90)
                            .scrollContentBackground(.hidden)
                            .padding(Theme.Spacing.small)
                            .glassCard(padding: 0)

                        TextField("Title text overlay (optional)", text: $viewModel.request.titleText)
                            .padding(Theme.Spacing.small)
                            .glassCard(padding: 0)
                    }
                    .padding(.horizontal, Theme.Spacing.medium)

                    VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                        Text("Category")
                            .font(.AIVG.bodyEmphasized)
                            .padding(.horizontal, Theme.Spacing.medium)
                        ChipSelector(options: ThumbnailStyle.allCases, selection: $viewModel.request.style, title: { $0.displayName }, icon: { $0.systemImage })
                    }

                    VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                        Text("Aspect Ratio")
                            .font(.AIVG.bodyEmphasized)
                            .padding(.horizontal, Theme.Spacing.medium)
                        ChipSelector(options: VideoAspectRatio.allCases, selection: $viewModel.request.aspectRatio, title: { $0.displayName })
                    }

                    PrimaryButton(title: "Generate Thumbnails", systemImage: "sparkles", isLoading: viewModel.isGenerating) {
                        Task { await viewModel.generate() }
                    }
                    .padding(.horizontal, Theme.Spacing.medium)

                    if !viewModel.results.isEmpty {
                        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
                            SectionHeader(title: "Results", subtitle: "Layout & contrast suggested automatically")
                            ThumbnailResultGrid(results: viewModel.results, titleText: viewModel.request.titleText) { result in
                                Task { await viewModel.save(result) }
                            }
                            .padding(.horizontal, Theme.Spacing.medium)
                        }
                    }
                }
                .padding(.top, Theme.Spacing.small)
                .padding(.bottom, Theme.Spacing.large)
            }
        }
        .navigationTitle("Create Thumbnail")
        .navigationBarTitleDisplayMode(.inline)
        .toast($viewModel.toast)
    }
}
