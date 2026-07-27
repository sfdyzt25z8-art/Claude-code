import SwiftUI

struct CameraControlPickerView: View {
    let selected: [CameraMovement]
    let onToggle: (CameraMovement) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text("Camera Controls")
                .font(.AIVG.bodyEmphasized)
                .padding(.horizontal, Theme.Spacing.medium)

            MultiChipSelector(
                options: CameraMovement.allCases,
                selection: Binding(
                    get: { Set(selected) },
                    set: { newValue in
                        for movement in CameraMovement.allCases {
                            let isSelected = selected.contains(movement)
                            let shouldBeSelected = newValue.contains(movement)
                            if isSelected != shouldBeSelected { onToggle(movement) }
                        }
                    }
                ),
                title: { $0.displayName },
                icon: { $0.systemImage }
            )
        }
    }
}

struct LightingPickerView: View {
    @Binding var selected: LightingStyle

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text("Lighting")
                .font(.AIVG.bodyEmphasized)
                .padding(.horizontal, Theme.Spacing.medium)

            ChipSelector(options: LightingStyle.allCases, selection: $selected, title: { $0.displayName }, icon: { $0.systemImage })
        }
    }
}
