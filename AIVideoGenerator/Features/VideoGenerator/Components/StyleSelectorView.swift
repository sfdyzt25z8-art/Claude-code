import SwiftUI

struct StyleSelectorView: View {
    @Binding var selectedStyle: VideoStyle

    private let columns = [GridItem(.adaptive(minimum: 84), spacing: Theme.Spacing.xSmall)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: Theme.Spacing.xSmall) {
            ForEach(VideoStyle.allCases) { style in
                Button {
                    withAnimation(Theme.Animation.standard) { selectedStyle = style }
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: style.systemImage)
                            .font(.system(size: 18, weight: .semibold))
                        Text(style.displayName)
                            .font(.AIVG.caption)
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .foregroundStyle(selectedStyle == style ? .white : Theme.Colors.textPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.small)
                    .background {
                        RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous)
                            .fill(selectedStyle == style ? AnyShapeStyle(Theme.Gradients.brand) : AnyShapeStyle(.ultraThinMaterial))
                    }
                }
                .buttonStyle(PressableButtonStyle())
            }
        }
    }
}
