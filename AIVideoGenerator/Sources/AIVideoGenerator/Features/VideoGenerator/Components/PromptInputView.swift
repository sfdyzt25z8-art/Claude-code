import SwiftUI

/// Multi-line prompt editor with the AI Prompt Assistant action row (improve,
/// expand, shorten, translate, suggest) directly beneath it.
struct PromptInputView: View {
    @Binding var prompt: String
    let isAssisting: Bool
    let onAction: (PromptAssistAction) -> Void
    let onSuggest: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Describe your video")

            GlassCard {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    TextEditor(text: $prompt)
                        .frame(minHeight: 100)
                        .scrollContentBackground(.hidden)
                        .font(Typography.body)
                        .overlay(alignment: .topLeading) {
                            if prompt.isEmpty {
                                Text("A futuristic cyberpunk city at night with flying cars and cinematic lighting.")
                                    .font(Typography.body)
                                    .foregroundStyle(Theme.secondaryText)
                                    .padding(.top, 8)
                                    .padding(.leading, 5)
                                    .allowsHitTesting(false)
                            }
                        }

                    if isAssisting {
                        HStack(spacing: Spacing.xxs) {
                            ProgressView().controlSize(.small)
                            Text("Thinking…")
                                .font(Typography.caption)
                                .foregroundStyle(Theme.secondaryText)
                        }
                    }
                }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.xs) {
                    assistButton("Improve", "wand.and.stars", .improve)
                    assistButton("Expand", "arrow.up.left.and.arrow.down.right", .expand)
                    assistButton("Shorten", "arrow.down.right.and.arrow.up.left", .shorten)
                    assistButton("Translate", "globe", .translate)
                    Button(action: onSuggest) {
                        Label("Suggest Everything", systemImage: "sparkles")
                            .font(Typography.subheadline)
                            .padding(.horizontal, Spacing.sm)
                            .padding(.vertical, Spacing.xs)
                            .foregroundStyle(.white)
                            .background(Theme.brandGradient, in: Capsule())
                    }
                    .buttonStyle(ScaleButtonStyle())
                }
            }
        }
    }

    private func assistButton(_ title: String, _ symbol: String, _ action: PromptAssistAction) -> some View {
        Button {
            onAction(action)
        } label: {
            Label(title, systemImage: symbol)
                .font(Typography.subheadline)
                .padding(.horizontal, Spacing.sm)
                .padding(.vertical, Spacing.xs)
                .foregroundStyle(Theme.primaryText)
                .background(Theme.secondaryBackground, in: Capsule())
                .overlay(Capsule().strokeBorder(Theme.divider, lineWidth: 1))
        }
        .buttonStyle(ScaleButtonStyle())
        .disabled(isAssisting)
    }
}
