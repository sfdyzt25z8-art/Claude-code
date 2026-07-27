import SwiftUI

/// Contextual bottom panel whose contents change based on the selected
/// `EditorTool`. Kept in one file since each panel is small and they all
/// share the same presentation chrome.
struct EditorToolPanel: View {
    let tool: EditorTool
    @ObservedObject var viewModel: VideoEditorViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
            Text(tool.displayName)
                .font(.AIVG.headline)

            switch tool {
            case .trim: trimPanel
            case .split: splitPanel
            case .merge: mergePanel
            case .crop: cropPanel
            case .rotate: rotatePanel
            case .speed: speedPanel
            case .transitions: transitionsPanel
            case .titles: titlesPanel
            case .captions: captionsPanel
            case .colorGrading: colorGradingPanel
            case .effects: effectsPanel
            case .sound: soundPanel
            case .export: EmptyView()
            }
        }
        .padding(Theme.Spacing.medium)
        .glassCard()
        .padding(.horizontal, Theme.Spacing.medium)
        .padding(.bottom, Theme.Spacing.medium)
    }

    private var selectedClip: EditorClip? { viewModel.selectedClip }

    @ViewBuilder private var trimPanel: some View {
        if let clip = selectedClip {
            VStack(alignment: .leading) {
                Text("Start: \(clip.trimStart, specifier: "%.1f")s  End: \(clip.trimEnd, specifier: "%.1f")s")
                    .font(.AIVG.footnote)
                RangeSlider(
                    lowerValue: Binding(
                        get: { clip.trimStart },
                        set: { viewModel.trim(clipID: clip.id, start: $0, end: clip.trimEnd) }
                    ),
                    upperValue: Binding(
                        get: { clip.trimEnd },
                        set: { viewModel.trim(clipID: clip.id, start: clip.trimStart, end: $0) }
                    ),
                    bounds: 0...(clip.trimEnd + 5)
                )
            }
        } else {
            Text("Select a clip on the timeline to trim it.").font(.AIVG.footnote).foregroundStyle(Theme.Colors.textSecondary)
        }
    }

    private var splitPanel: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xSmall) {
            Text("Splits the selected clip at the playhead position.")
                .font(.AIVG.footnote)
                .foregroundStyle(Theme.Colors.textSecondary)
            SecondaryButton(title: "Split at Playhead", systemImage: "square.split.2x1") {
                if let id = viewModel.selectedClipID {
                    viewModel.split(clipID: id, at: viewModel.playheadTime)
                }
            }
        }
    }

    private var mergePanel: some View {
        HStack(spacing: Theme.Spacing.small) {
            SecondaryButton(title: "Merge with Previous", systemImage: "arrow.left") {
                if let id = viewModel.selectedClipID { viewModel.merge(clipID: id, withNext: false) }
            }
            SecondaryButton(title: "Merge with Next", systemImage: "arrow.right") {
                if let id = viewModel.selectedClipID { viewModel.merge(clipID: id, withNext: true) }
            }
        }
    }

    @ViewBuilder private var cropPanel: some View {
        if let clip = selectedClip {
            Picker("Aspect", selection: Binding(
                get: { clip.cropRect == nil ? "Original" : "Custom" },
                set: { newValue in
                    viewModel.setCrop(newValue == "Original" ? nil : CGRect(x: 0, y: 0, width: 1, height: 1), forClip: clip.id)
                }
            )) {
                Text("Original").tag("Original")
                Text("Custom").tag("Custom")
            }
            .pickerStyle(.segmented)
        } else {
            Text("Select a clip to crop.").font(.AIVG.footnote).foregroundStyle(Theme.Colors.textSecondary)
        }
    }

    @ViewBuilder private var rotatePanel: some View {
        if let clip = selectedClip {
            HStack {
                ForEach([0.0, 90.0, 180.0, 270.0], id: \.self) { degrees in
                    Button("\(Int(degrees))°") {
                        viewModel.setRotation(degrees, forClip: clip.id)
                    }
                    .buttonStyle(.bordered)
                    .tint(clip.rotationDegrees == degrees ? Theme.Colors.accentPrimary : nil)
                }
            }
        }
    }

    @ViewBuilder private var speedPanel: some View {
        if let clip = selectedClip {
            VStack(alignment: .leading) {
                Text("Speed: \(clip.speed, specifier: "%.2f")x").font(.AIVG.footnote)
                Slider(value: Binding(
                    get: { clip.speed },
                    set: { viewModel.setSpeed($0, forClip: clip.id) }
                ), in: 0.25...4.0)
            }
        } else {
            Text("Select a clip to change its speed.").font(.AIVG.footnote).foregroundStyle(Theme.Colors.textSecondary)
        }
    }

    @ViewBuilder private var transitionsPanel: some View {
        if let clip = selectedClip {
            ChipSelector(options: EditorClip.Transition.allCases, selection: Binding(
                get: { clip.transitionToNext },
                set: { viewModel.setTransition($0, forClip: clip.id) }
            ), title: { $0.displayName })
        } else {
            Text("Select a clip to set its transition.").font(.AIVG.footnote).foregroundStyle(Theme.Colors.textSecondary)
        }
    }

    private var titlesPanel: some View {
        TitleEntryField { text in
            viewModel.addTitle(text: text)
        }
    }

    private var captionsPanel: some View {
        SubtitlesPanel(
            subtitles: viewModel.subtitles,
            playheadTime: viewModel.playheadTime,
            onAdd: { text in
                viewModel.addSubtitleCue(text: text, start: viewModel.playheadTime, end: viewModel.playheadTime + 2)
            },
            onRemove: viewModel.removeSubtitleCue
        )
    }

    private var colorGradingPanel: some View {
        VStack(alignment: .leading) {
            Text("Intensity: \(Int(viewModel.colorGradingIntensity * 100))%").font(.AIVG.footnote)
            Slider(value: $viewModel.colorGradingIntensity, in: 0...1)
        }
    }

    private var effectsPanel: some View {
        MultiChipSelector(
            options: VisualEffect.allCases,
            selection: Binding(
                get: { viewModel.appliedEffects },
                set: { newValue in
                    for effect in VisualEffect.allCases {
                        if viewModel.appliedEffects.contains(effect) != newValue.contains(effect) {
                            viewModel.toggleEffect(effect)
                        }
                    }
                }
            ),
            title: { $0.displayName },
            icon: { $0.systemImage }
        )
    }

    private var soundPanel: some View {
        SoundPanel(
            soundAssets: viewModel.soundAssets,
            onAddAmbient: viewModel.addAmbientSound,
            onRemove: viewModel.removeSound,
            onVolumeChange: viewModel.updateVolume
        )
    }
}

/// Minimal dual-thumb range slider used for trim start/end. Built from
/// primitives rather than `Slider` since SwiftUI has no built-in range control.
struct RangeSlider: View {
    @Binding var lowerValue: TimeInterval
    @Binding var upperValue: TimeInterval
    let bounds: ClosedRange<TimeInterval>

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            ZStack(alignment: .leading) {
                Capsule().fill(Color.gray.opacity(0.25)).frame(height: 6)

                Capsule()
                    .fill(Theme.Gradients.brand)
                    .frame(width: max(0, position(upperValue, width: width) - position(lowerValue, width: width)), height: 6)
                    .offset(x: position(lowerValue, width: width))

                thumb(value: $lowerValue, width: width)
                thumb(value: $upperValue, width: width)
            }
        }
        .frame(height: 24)
    }

    private func position(_ value: TimeInterval, width: CGFloat) -> CGFloat {
        let fraction = (value - bounds.lowerBound) / (bounds.upperBound - bounds.lowerBound)
        return CGFloat(fraction) * width
    }

    private func thumb(value: Binding<TimeInterval>, width: CGFloat) -> some View {
        Circle()
            .fill(.white)
            .frame(width: 20, height: 20)
            .shadow(radius: 2)
            .offset(x: position(value.wrappedValue, width: width) - 10)
            .gesture(
                DragGesture()
                    .onChanged { drag in
                        let fraction = max(0, min(1, drag.location.x / width))
                        value.wrappedValue = bounds.lowerBound + Double(fraction) * (bounds.upperBound - bounds.lowerBound)
                    }
            )
    }
}

private struct TitleEntryField: View {
    @State private var text = ""
    let onAdd: (String) -> Void

    var body: some View {
        HStack {
            TextField("Title text", text: $text)
                .textFieldStyle(.roundedBorder)
            Button("Add") {
                guard !text.isEmpty else { return }
                onAdd(text)
                text = ""
            }
        }
    }
}
