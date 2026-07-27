import SwiftUI

struct ProjectRow: View {
    let project: VideoProject
    var onFavoriteTapped: () -> Void

    var body: some View {
        HStack(spacing: Theme.Spacing.small) {
            RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous)
                .fill(LinearGradient(colors: [Theme.Colors.brandGradientStart.opacity(0.5), Theme.Colors.brandGradientEnd.opacity(0.5)], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 64, height: 40)
                .overlay {
                    Image(systemName: project.kind == .video ? "play.fill" : "photo.fill")
                        .foregroundStyle(.white)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(project.title)
                    .font(.AIVG.subheadline)
                    .lineLimit(1)
                HStack(spacing: 4) {
                    Text(project.updatedAt, style: .date)
                    if let folder = project.folder {
                        Text("· \(folder)")
                    }
                }
                .font(.AIVG.caption)
                .foregroundStyle(Theme.Colors.textSecondary)
            }

            Spacer()

            Button(action: onFavoriteTapped) {
                Image(systemName: project.isFavorite ? "heart.fill" : "heart")
                    .foregroundStyle(project.isFavorite ? Theme.Colors.danger : Theme.Colors.textTertiary)
            }
        }
        .padding(.vertical, 4)
    }
}
