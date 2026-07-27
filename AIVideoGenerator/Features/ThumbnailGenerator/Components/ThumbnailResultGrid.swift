import SwiftUI

/// Displays generated thumbnail candidates with AI-suggested text placement
/// and contrast overlays so the creator can see layout guidance at a glance.
struct ThumbnailResultGrid: View {
    let results: [ThumbnailResult]
    let titleText: String
    let onSave: (ThumbnailResult) -> Void

    private let columns = [GridItem(.flexible(), spacing: Theme.Spacing.small), GridItem(.flexible(), spacing: Theme.Spacing.small)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: Theme.Spacing.small) {
            ForEach(results) { result in
                VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                    ZStack(alignment: .topLeading) {
                        RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous)
                            .fill(Color(hex: result.dominantColorHex).opacity(0.65))
                            .aspectRatio(16.0 / 9.0, contentMode: .fit)

                        GeometryReader { proxy in
                            if !titleText.isEmpty {
                                Text(titleText)
                                    .font(.system(size: 11, weight: .heavy))
                                    .foregroundStyle(Color(hex: result.titlePlacement.suggestedTextColorHex))
                                    .padding(4)
                                    .frame(
                                        width: proxy.size.width * result.titlePlacement.width,
                                        height: proxy.size.height * result.titlePlacement.height,
                                        alignment: .leading
                                    )
                                    .background(.black.opacity(result.titlePlacement.suggestedBackdropOpacity))
                                    .position(
                                        x: proxy.size.width * (result.titlePlacement.x + result.titlePlacement.width / 2),
                                        y: proxy.size.height * (result.titlePlacement.y + result.titlePlacement.height / 2)
                                    )
                            }
                        }
                        .aspectRatio(16.0 / 9.0, contentMode: .fit)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous))

                    HStack {
                        Label("\(Int(result.contrastScore * 100))% contrast", systemImage: "circle.lefthalf.filled")
                            .font(.AIVG.caption)
                            .foregroundStyle(Theme.Colors.textSecondary)
                        Spacer()
                        Button {
                            onSave(result)
                        } label: {
                            Image(systemName: "square.and.arrow.down.fill")
                        }
                    }
                }
            }
        }
    }
}
