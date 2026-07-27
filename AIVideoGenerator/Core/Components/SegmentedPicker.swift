import SwiftUI

/// A custom glass-styled segmented control, used for resolution / fps /
/// aspect ratio pickers where the native `Picker` feels too utilitarian.
struct SegmentedPicker<Option: Identifiable & Hashable>: View {
    let options: [Option]
    @Binding var selection: Option
    let title: (Option) -> String

    @Namespace private var namespace

    var body: some View {
        HStack(spacing: 4) {
            ForEach(options) { option in
                let isSelected = option == selection
                Text(title(option))
                    .font(.AIVG.subheadline)
                    .fontWeight(isSelected ? .semibold : .regular)
                    .foregroundStyle(isSelected ? .white : Theme.Colors.textSecondary)
                    .padding(.vertical, Theme.Spacing.xSmall)
                    .frame(maxWidth: .infinity)
                    .background {
                        if isSelected {
                            RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous)
                                .fill(Theme.Gradients.brand)
                                .matchedGeometryEffect(id: "segment", in: namespace)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        withAnimation(Theme.Animation.standard) {
                            selection = option
                        }
                    }
            }
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous)
                .fill(.ultraThinMaterial)
        )
    }
}
