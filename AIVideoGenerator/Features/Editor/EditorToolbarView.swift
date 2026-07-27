import SwiftUI

enum EditorTool: String, CaseIterable, Identifiable, Equatable {
    case trim, split, merge, crop, rotate, speed, transitions, titles, captions, colorGrading, effects, sound, export

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .trim: "Trim"
        case .split: "Split"
        case .merge: "Merge"
        case .crop: "Crop"
        case .rotate: "Rotate"
        case .speed: "Speed"
        case .transitions: "Transitions"
        case .titles: "Titles"
        case .captions: "Captions"
        case .colorGrading: "Color"
        case .effects: "Effects"
        case .sound: "Sound"
        case .export: "Export"
        }
    }

    var systemImage: String {
        switch self {
        case .trim: "scissors"
        case .split: "square.split.2x1"
        case .merge: "rectangle.connected.to.line.below"
        case .crop: "crop"
        case .rotate: "rotate.right"
        case .speed: "speedometer"
        case .transitions: "arrow.left.arrow.right.square"
        case .titles: "textformat"
        case .captions: "captions.bubble"
        case .colorGrading: "paintpalette"
        case .effects: "wand.and.stars"
        case .sound: "waveform"
        case .export: "square.and.arrow.up"
        }
    }
}

struct EditorToolbarView: View {
    let onSelect: (EditorTool) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.small) {
                ForEach(EditorTool.allCases) { tool in
                    Button {
                        onSelect(tool)
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: tool.systemImage)
                                .font(.system(size: 18, weight: .medium))
                            Text(tool.displayName)
                                .font(.AIVG.caption)
                        }
                        .foregroundStyle(Theme.Colors.textPrimary)
                        .frame(width: 64)
                    }
                    .buttonStyle(PressableButtonStyle())
                }
            }
            .padding(.horizontal, Theme.Spacing.medium)
            .padding(.vertical, Theme.Spacing.xSmall)
        }
        .background(.ultraThinMaterial)
    }
}
