import SwiftUI

/// A horizontally-wrapping chip selector for enum-driven pickers (style, camera
/// movement, lighting, etc.). Supports single or multi-selection.
struct ChipSelector<Option: Identifiable & Hashable>: View {
    let options: [Option]
    @Binding var selection: Set<Option.ID>
    let label: (Option) -> String
    var systemImage: ((Option) -> String)? = nil
    var allowsMultipleSelection: Bool = true

    var body: some View {
        FlowLayout(spacing: Spacing.xs) {
            ForEach(options) { option in
                let isSelected = selection.contains(option.id)
                Button {
                    toggle(option)
                } label: {
                    HStack(spacing: Spacing.xxs) {
                        if let systemImage {
                            Image(systemName: systemImage(option))
                        }
                        Text(label(option))
                    }
                    .font(Typography.subheadline)
                    .padding(.horizontal, Spacing.sm)
                    .padding(.vertical, Spacing.xs)
                    .foregroundStyle(isSelected ? .white : Theme.primaryText)
                    .background(
                        isSelected ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.secondaryBackground)
                    )
                    .overlay(
                        Capsule().strokeBorder(isSelected ? .clear : Theme.divider, lineWidth: 1)
                    )
                    .clipShape(Capsule())
                }
                .buttonStyle(ScaleButtonStyle())
                .accessibilityAddTraits(isSelected ? [.isSelected] : [])
            }
        }
    }

    private func toggle(_ option: Option) {
        if allowsMultipleSelection {
            if selection.contains(option.id) {
                selection.remove(option.id)
            } else {
                selection.insert(option.id)
            }
        } else {
            selection = [option.id]
        }
    }
}

/// A simple flow (wrapping) layout, used so chip collections wrap onto multiple
/// lines instead of overflowing or scrolling horizontally.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rowWidth: CGFloat = 0
        var totalHeight: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowWidth + size.width > maxWidth, rowWidth > 0 {
                totalHeight += rowHeight + spacing
                rowWidth = 0
                rowHeight = 0
            }
            rowWidth += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        totalHeight += rowHeight
        return CGSize(width: maxWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var origin = bounds.origin
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if origin.x + size.width > bounds.maxX, origin.x > bounds.minX {
                origin.x = bounds.origin.x
                origin.y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: origin, proposal: .unspecified)
            origin.x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
