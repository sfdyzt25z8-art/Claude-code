import SwiftUI

struct ProjectCard: View {
    let project: VideoProject
    var onFavoriteTapped: (() -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous)
                    .fill(LinearGradient(colors: [Theme.Colors.brandGradientStart.opacity(0.5), Theme.Colors.brandGradientEnd.opacity(0.5)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .aspectRatio(16.0 / 9.0, contentMode: .fit)
                    .overlay {
                        Image(systemName: project.kind == .video ? "play.circle.fill" : "photo.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(.white.opacity(0.9))
                    }

                if let onFavoriteTapped {
                    Button(action: onFavoriteTapped) {
                        Image(systemName: project.isFavorite ? "heart.fill" : "heart")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(project.isFavorite ? Theme.Colors.danger : .white)
                            .padding(8)
                            .background(.black.opacity(0.25), in: Circle())
                    }
                    .padding(6)
                }
            }

            Text(project.title)
                .font(.AIVG.subheadline)
                .foregroundStyle(Theme.Colors.textPrimary)
                .lineLimit(1)

            Text(project.updatedAt, style: .relative)
                .font(.AIVG.caption)
                .foregroundStyle(Theme.Colors.textSecondary)
        }
        .frame(width: 180)
    }
}

struct RecentProjectsSection: View {
    let projects: [VideoProject]
    var onFavoriteTapped: (VideoProject) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
            SectionHeader(title: "Recent Projects")

            if projects.isEmpty {
                EmptyStateView(
                    systemImage: "clock.arrow.circlepath",
                    title: "No Projects Yet",
                    message: "Your generated videos and thumbnails will show up here."
                )
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Theme.Spacing.small) {
                        ForEach(projects) { project in
                            NavigationLink(value: project) {
                                ProjectCard(project: project) {
                                    onFavoriteTapped(project)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, Theme.Spacing.medium)
                }
            }
        }
    }
}
