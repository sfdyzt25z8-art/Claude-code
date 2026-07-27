import SwiftUI

struct TemplatesSection: View {
    let templates: [VideoTemplate]
    let onSelect: (VideoTemplate) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
            SectionHeader(title: "Templates", subtitle: "Jump-start your next video")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.small) {
                    ForEach(templates) { template in
                        Button {
                            onSelect(template)
                        } label: {
                            VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                                ZStack(alignment: .topLeading) {
                                    RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous)
                                        .fill(Theme.Gradients.brand)
                                        .frame(width: 160, height: 100)
                                        .overlay {
                                            Image(systemName: template.style.systemImage)
                                                .font(.system(size: 26))
                                                .foregroundStyle(.white.opacity(0.9))
                                        }

                                    if template.isTrending {
                                        Text("TRENDING")
                                            .font(.AIVG.captionBold)
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(.black.opacity(0.35), in: Capsule())
                                            .padding(8)
                                    }
                                }

                                Text(template.name)
                                    .font(.AIVG.subheadline)
                                    .foregroundStyle(Theme.Colors.textPrimary)
                                    .lineLimit(1)
                                    .frame(width: 160, alignment: .leading)
                            }
                        }
                        .buttonStyle(PressableButtonStyle())
                    }
                }
                .padding(.horizontal, Theme.Spacing.medium)
            }
        }
    }
}

struct TrendingStylesSection: View {
    let styles: [VideoStyle]
    let onSelect: (VideoStyle) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
            SectionHeader(title: "Trending Styles")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.xSmall) {
                    ForEach(styles) { style in
                        Button {
                            onSelect(style)
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: style.systemImage)
                                Text(style.displayName)
                            }
                            .font(.AIVG.subheadline)
                            .padding(.horizontal, Theme.Spacing.small)
                            .padding(.vertical, Theme.Spacing.xSmall)
                            .glassCard(cornerRadius: Theme.Radius.pill, padding: 0)
                            .padding(.horizontal, Theme.Spacing.small)
                            .padding(.vertical, Theme.Spacing.xSmall)
                        }
                        .buttonStyle(PressableButtonStyle())
                    }
                }
                .padding(.horizontal, Theme.Spacing.medium)
            }
        }
    }
}
