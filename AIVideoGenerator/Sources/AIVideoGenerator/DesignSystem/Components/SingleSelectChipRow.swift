import SwiftUI

/// Convenience wrapper around `ChipSelector` for single-value enum pickers
/// (style, resolution, frame rate, aspect ratio) where the underlying state is a
/// plain `Binding<Option>` rather than a `Set<Option.ID>`.
struct SingleSelectChipRow<Option: Identifiable & Hashable>: View {
    let title: String
    let options: [Option]
    @Binding var selection: Option
    let label: (Option) -> String
    var systemImage: ((Option) -> String)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: title)
            ChipSelector(
                options: options,
                selection: Binding(
                    get: { Set([selection.id]) },
                    set: { newValue in
                        if let id = newValue.first, let match = options.first(where: { $0.id == id }) {
                            selection = match
                        }
                    }
                ),
                label: label,
                systemImage: systemImage,
                allowsMultipleSelection: false
            )
        }
    }
}
