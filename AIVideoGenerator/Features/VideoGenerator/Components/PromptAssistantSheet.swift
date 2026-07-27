import SwiftUI

/// AI Prompt Assistant: improve/expand/shorten/translate the current prompt,
/// plus quick-suggest chips for styles, lighting, camera moves, moods,
/// environments, and cinematic shots.
struct PromptAssistantSheet: View {
    @ObservedObject var viewModel: VideoGeneratorViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var suggestions: [PromptSuggestionCategory: [String]] = [:]
    @State private var loadingCategory: PromptSuggestionCategory?

    var body: some View {
        NavigationStack {
            ZStack {
                AuroraBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.Spacing.large) {
                        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                            Text("Your Prompt")
                                .font(.AIVG.bodyEmphasized)
                            TextEditor(text: $viewModel.request.prompt)
                                .frame(minHeight: 100)
                                .scrollContentBackground(.hidden)
                                .padding(Theme.Spacing.small)
                                .glassCard(padding: 0)
                        }

                        actionButtons

                        ForEach(PromptSuggestionCategory.allCases, id: \.self) { category in
                            suggestionSection(category)
                        }
                    }
                    .padding(Theme.Spacing.medium)
                }
            }
            .navigationTitle("Prompt Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private var actionButtons: some View {
        HStack(spacing: Theme.Spacing.xSmall) {
            ForEach(PromptAssistAction.allCases, id: \.self) { action in
                Button {
                    Task { await viewModel.applyPromptAssist(action) }
                } label: {
                    if viewModel.isAssisting {
                        ProgressView().frame(maxWidth: .infinity)
                    } else {
                        Text(action.rawValue.capitalized)
                            .font(.AIVG.subheadline)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.vertical, Theme.Spacing.xSmall)
                .glassCard(cornerRadius: Theme.Radius.medium, padding: 0)
                .disabled(viewModel.isAssisting)
            }
        }
    }

    private func suggestionSection(_ category: PromptSuggestionCategory) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text(title(for: category))
                .font(.AIVG.bodyEmphasized)

            if loadingCategory == category {
                ProgressView()
            } else if let items = suggestions[category] {
                FlowChips(items: items) { item in
                    viewModel.request.prompt += viewModel.request.prompt.isEmpty ? item : ", \(item)"
                }
            } else {
                Button("Suggest \(title(for: category))") {
                    Task {
                        loadingCategory = category
                        suggestions[category] = await viewModel.fetchSuggestions(for: category)
                        loadingCategory = nil
                    }
                }
                .font(.AIVG.subheadline)
            }
        }
    }

    private func title(for category: PromptSuggestionCategory) -> String {
        switch category {
        case .style: "Styles"
        case .lighting: "Lighting"
        case .cameraMovement: "Camera Movements"
        case .mood: "Moods"
        case .environment: "Environments"
        case .cinematicShot: "Cinematic Shots"
        }
    }
}

/// Simple wrapping chip layout for suggestion pills.
struct FlowChips: View {
    let items: [String]
    let onTap: (String) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.xSmall) {
                ForEach(items, id: \.self) { item in
                    Button {
                        onTap(item)
                    } label: {
                        Text(item)
                            .font(.AIVG.footnote)
                            .padding(.horizontal, Theme.Spacing.small)
                            .padding(.vertical, 6)
                            .background(.ultraThinMaterial, in: Capsule())
                    }
                }
            }
        }
    }
}
