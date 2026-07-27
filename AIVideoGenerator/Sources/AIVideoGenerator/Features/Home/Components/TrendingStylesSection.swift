import SwiftUI

/// Showcases currently-popular styles as tappable chips that pre-fill the style
/// selection when the user opens the Video Generator.
struct TrendingStylesSection: View {
    let styles: [VideoStyle]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Trending Styles")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.sm) {
                    ForEach(styles) { style in
                        VStack(spacing: Spacing.xs) {
                            Image(systemName: style.symbolName)
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(width: 56, height: 56)
                                .background(Theme.brandGradient, in: Circle())

                            Text(style.displayName)
                                .font(Typography.caption)
                                .foregroundStyle(Theme.secondaryText)
                        }
                        .frame(width: 72)
                    }
                }
            }
        }
    }
}

/// Curated prompt starting points shown as a horizontal card row.
struct TemplatesSection: View {
    let templates: [PromptTemplate]
    let onSelect: (PromptTemplate) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Templates")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.sm) {
                    ForEach(templates) { template in
                        Button {
                            onSelect(template)
                        } label: {
                            GlassCard(padding: Spacing.sm) {
                                VStack(alignment: .leading, spacing: Spacing.xs) {
                                    Image(systemName: template.symbolName)
                                        .foregroundStyle(Theme.primaryText)
                                    Text(template.title)
                                        .font(Typography.subheadline)
                                        .foregroundStyle(Theme.primaryText)
                                    Text(template.style.displayName)
                                        .font(Typography.caption)
                                        .foregroundStyle(Theme.secondaryText)
                                }
                                .frame(width: 140, alignment: .leading)
                            }
                        }
                        .buttonStyle(ScaleButtonStyle())
                    }
                }
            }
        }
    }
}
