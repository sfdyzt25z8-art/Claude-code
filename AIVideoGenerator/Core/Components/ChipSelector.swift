import SwiftUI

/// A horizontally scrolling set of selectable chips, used for styles,
/// lighting, camera moves, and other single-choice option sets.
struct ChipSelector<Option: Identifiable & Hashable>: View {
    let options: [Option]
    @Binding var selection: Option
    let title: (Option) -> String
    var icon: ((Option) -> String)? = nil

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.xSmall) {
                ForEach(options) { option in
                    ChipView(
                        label: title(option),
                        systemImage: icon?(option),
                        isSelected: option == selection
                    ) {
                        withAnimation(Theme.Animation.standard) {
                            selection = option
                        }
                    }
                }
            }
            .padding(.horizontal, Theme.Spacing.medium)
            .padding(.vertical, Theme.Spacing.xxSmall)
        }
    }
}

/// Multi-select variant used for effects, ambient sounds, etc.
struct MultiChipSelector<Option: Identifiable & Hashable>: View {
    let options: [Option]
    @Binding var selection: Set<Option>
    let title: (Option) -> String
    var icon: ((Option) -> String)? = nil

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.xSmall) {
                ForEach(options) { option in
                    ChipView(
                        label: title(option),
                        systemImage: icon?(option),
                        isSelected: selection.contains(option)
                    ) {
                        withAnimation(Theme.Animation.standard) {
                            if selection.contains(option) {
                                selection.remove(option)
                            } else {
                                selection.insert(option)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, Theme.Spacing.medium)
            .padding(.vertical, Theme.Spacing.xxSmall)
        }
    }
}

struct ChipView: View {
    let label: String
    var systemImage: String?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 13, weight: .semibold))
                }
                Text(label)
                    .font(.AIVG.subheadline)
                    .lineLimit(1)
            }
            .padding(.horizontal, Theme.Spacing.small + 2)
            .padding(.vertical, Theme.Spacing.xSmall)
            .foregroundStyle(isSelected ? .white : Theme.Colors.textPrimary)
            .background {
                if isSelected {
                    Capsule().fill(Theme.Gradients.brand)
                } else {
                    Capsule().fill(.ultraThinMaterial)
                    Capsule().strokeBorder(Theme.Colors.glassStroke, lineWidth: 1)
                }
            }
        }
        .buttonStyle(PressableButtonStyle())
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}
