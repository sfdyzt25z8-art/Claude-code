import SwiftUI

struct VideoOptionsPanel: View {
    @Binding var resolution: VideoResolution
    @Binding var frameRate: VideoFrameRate
    @Binding var aspectRatio: VideoAspectRatio

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.medium) {
            optionRow(title: "Resolution") {
                SegmentedPicker(options: VideoResolution.allCases, selection: $resolution) { $0.displayName }
            }
            optionRow(title: "Frame Rate") {
                SegmentedPicker(options: VideoFrameRate.allCases, selection: $frameRate) { $0.displayName }
            }
            optionRow(title: "Aspect Ratio") {
                VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
                    ChipSelector(options: VideoAspectRatio.allCases, selection: $aspectRatio) { $0.displayName }
                    Text(aspectRatio.usageHint)
                        .font(.AIVG.caption)
                        .foregroundStyle(Theme.Colors.textSecondary)
                        .padding(.horizontal, Theme.Spacing.medium)
                }
            }
        }
    }

    private func optionRow<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text(title)
                .font(.AIVG.bodyEmphasized)
                .padding(.horizontal, Theme.Spacing.medium)
            content()
        }
    }
}
