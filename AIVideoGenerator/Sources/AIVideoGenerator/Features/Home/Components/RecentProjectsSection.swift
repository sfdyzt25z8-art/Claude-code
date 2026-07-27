import SwiftUI

/// Horizontally-scrolling row of project cards, reused for both "Recent Projects"
/// and "Favorites" sections.
struct RecentProjectsSection: View {
    let title: String
    let projects: [VideoProject]
    let onToggleFavorite: (VideoProject) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: title)

            if projects.isEmpty {
                EmptyStateRow(message: "Nothing here yet — your generated videos will show up in this section.")
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Spacing.sm) {
                        ForEach(projects) { project in
                            ProjectCard(project: project, onToggleFavorite: { onToggleFavorite(project) })
                        }
                    }
                }
            }
        }
    }
}

private struct ProjectCard: View {
    let project: VideoProject
    let onToggleFavorite: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            ZStack(alignment: .topTrailing) {
                ShimmerPlaceholder(cornerRadius: Theme.Radius.small)
                    .frame(width: 160, height: 90)

                Button(action: onToggleFavorite) {
                    Image(systemName: project.isFavorite ? "heart.fill" : "heart")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(project.isFavorite ? Theme.danger : .white)
                        .padding(6)
                        .background(.black.opacity(0.35), in: Circle())
                }
                .padding(6)
            }

            Text(project.name)
                .font(Typography.subheadline)
                .foregroundStyle(Theme.primaryText)
                .lineLimit(1)

            Text(project.style.displayName)
                .font(Typography.caption)
                .foregroundStyle(Theme.secondaryText)
        }
        .frame(width: 160)
    }
}

struct EmptyStateRow: View {
    let message: String

    var body: some View {
        GlassCard {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(Theme.secondaryText)
                Text(message)
                    .font(Typography.subheadline)
                    .foregroundStyle(Theme.secondaryText)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
