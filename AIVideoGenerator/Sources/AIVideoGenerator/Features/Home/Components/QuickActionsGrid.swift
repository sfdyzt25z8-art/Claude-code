import SwiftUI

/// Grid of one-tap shortcuts (import, editor, subtitles, export) shown below the
/// hero cards on the Home dashboard. All four currently open the same Video
/// Editor entry point (pick a video, then trim/caption/export it) since that's
/// the one real, working flow behind them today.
struct QuickActionsGrid: View {
    let onSelect: () -> Void

    private let actions: [QuickAction] = [
        QuickAction(title: "Import Media", symbolName: "square.and.arrow.down"),
        QuickAction(title: "Video Editor", symbolName: "slider.horizontal.below.rectangle"),
        QuickAction(title: "Add Subtitles", symbolName: "captions.bubble"),
        QuickAction(title: "Export", symbolName: "square.and.arrow.up")
    ]

    private let columns = [GridItem(.adaptive(minimum: 84), spacing: Spacing.sm)]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Quick Actions")

            LazyVGrid(columns: columns, spacing: Spacing.sm) {
                ForEach(actions) { action in
                    Button(action: onSelect) {
                        VStack(spacing: Spacing.xs) {
                            Image(systemName: action.symbolName)
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundStyle(Theme.primaryText)
                                .frame(width: 48, height: 48)
                                .background(Theme.secondaryBackground, in: Circle())

                            Text(action.title)
                                .font(Typography.caption)
                                .foregroundStyle(Theme.secondaryText)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                        }
                    }
                    .buttonStyle(ScaleButtonStyle())
                }
            }
        }
    }

    private struct QuickAction: Identifiable {
        let id = UUID()
        let title: String
        let symbolName: String
    }
}
