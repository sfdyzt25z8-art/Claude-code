import SwiftUI

/// Rotation (90° steps) and crop (fixed aspect presets, centered). A fully
/// free-drag crop rectangle editor isn't implemented yet — these presets are
/// real (they produce an actual normalized `cropRect` the compositor honors),
/// just not arbitrarily adjustable.
struct CropRotatePanel: View {
    @Binding var clip: EditorClip

    private let cropPresets: [(name: String, rect: CGRect?)] = [
        ("None", nil),
        ("1:1", CGRect(x: 0.125, y: 0, width: 0.75, height: 1)),
        ("9:16", CGRect(x: 0.2815, y: 0, width: 0.4375, height: 1)),
        ("4:5", CGRect(x: 0.1, y: 0, width: 0.8, height: 1))
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Rotate")
            HStack(spacing: Spacing.sm) {
                SecondaryButton(title: "Rotate Left", systemImage: "rotate.left") {
                    clip.rotationDegrees -= 90
                }
                SecondaryButton(title: "Rotate Right", systemImage: "rotate.right") {
                    clip.rotationDegrees += 90
                }
            }

            SectionHeader(title: "Crop")
            HStack(spacing: Spacing.sm) {
                ForEach(cropPresets, id: \.name) { preset in
                    Button(preset.name) {
                        clip.cropRect = preset.rect
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .padding(Spacing.md)
    }
}

struct SpeedPanel: View {
    @Binding var clip: EditorClip
    private let presets: [Double] = [0.25, 0.5, 1, 1.5, 2, 4]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Speed")
            Text("\(clip.speed, specifier: "%.2f")x")
                .font(Typography.headline)
            Slider(value: $clip.speed, in: 0.25...4)
            HStack {
                ForEach(presets, id: \.self) { preset in
                    Button(Self.label(for: preset)) {
                        clip.speed = preset
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .padding(Spacing.md)
    }

    private static func label(for speed: Double) -> String {
        String(format: speed < 1 ? "%.2fx" : "%.0fx", speed)
    }
}

struct TransitionPanel: View {
    @Binding var clip: EditorClip
    let isLastClip: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Transition to Next Clip")
            if isLastClip {
                Text("This is the last clip — there's nothing to transition into.")
                    .font(Typography.subheadline)
                    .foregroundStyle(Theme.secondaryText)
            } else {
                Picker("Transition", selection: $clip.transition) {
                    ForEach(TransitionType.allCases) { transition in
                        Label(transition.displayName, systemImage: transition.symbolName).tag(transition)
                    }
                }
                .pickerStyle(.inline)

                if !clip.transition.isNone {
                    Text("Duration: \(clip.transitionDuration, specifier: "%.1f")s")
                        .font(Typography.subheadline)
                    Slider(value: $clip.transitionDuration, in: 0.2...2)
                }
            }
        }
        .padding(Spacing.md)
    }
}

struct ColorGradingPanel: View {
    @Binding var clip: EditorClip

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                SectionHeader(title: "Presets")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Spacing.sm) {
                        ForEach(ColorGradeSettings.presets, id: \.name) { preset in
                            Button(preset.name) {
                                clip.colorGrade = preset.settings
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }

                SectionHeader(title: "Fine-Tune")
                labeledSlider("Brightness", value: $clip.colorGrade.brightness, range: -1...1)
                labeledSlider("Contrast", value: $clip.colorGrade.contrast, range: 0...2)
                labeledSlider("Saturation", value: $clip.colorGrade.saturation, range: 0...2)
                labeledSlider("Temperature", value: $clip.colorGrade.temperature, range: 2000...12000)
                labeledSlider("Tint", value: $clip.colorGrade.tint, range: -100...100)
            }
            .padding(Spacing.md)
        }
    }

    private func labeledSlider(_ title: String, value: Binding<Double>, range: ClosedRange<Double>) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xxs) {
            Text(title).font(Typography.subheadline)
            Slider(value: value, in: range)
        }
    }
}

struct EffectsPanel: View {
    @Binding var clip: EditorClip

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Effects")
            ChipSelector(
                options: VideoEffectType.allCases,
                selection: Binding(
                    get: { clip.effect.map { Set([$0.id]) } ?? [] },
                    set: { ids in clip.effect = VideoEffectType.allCases.first { ids.contains($0.id) } }
                ),
                label: { $0.displayName },
                systemImage: { $0.symbolName },
                allowsMultipleSelection: false
            )

            SectionHeader(title: "Atmosphere & Particles")
            Text("Requires bundled overlay footage that doesn't ship with this build yet — see docs/ARCHITECTURE.md.")
                .font(Typography.caption)
                .foregroundStyle(Theme.secondaryText)
            ChipSelector(
                options: VFXOverlayType.allCases,
                selection: Binding(
                    get: { clip.vfxOverlay.map { Set([$0.id]) } ?? [] },
                    set: { ids in clip.vfxOverlay = VFXOverlayType.allCases.first { ids.contains($0.id) } }
                ),
                label: { $0.displayName },
                systemImage: { $0.symbolName },
                allowsMultipleSelection: false
            )
        }
        .padding(Spacing.md)
    }
}

struct ZoomPanel: View {
    @Binding var clip: EditorClip

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Zoom (Ken Burns)")
            HStack(spacing: Spacing.sm) {
                Button("None") { clip.zoomKeyframe = nil }
                Button("Push In") { clip.zoomKeyframe = .slowPushIn }
                Button("Pull Out") { clip.zoomKeyframe = .slowPullOut }
            }
            .buttonStyle(.bordered)
        }
        .padding(Spacing.md)
    }
}

struct PiPPanel: View {
    @Bindable var viewModel: VideoEditorViewModel

    private let cornerPresets: [(name: String, origin: CGPoint)] = [
        ("Top Left", CGPoint(x: 0.06, y: 0.06)),
        ("Top Right", CGPoint(x: 0.62, y: 0.06)),
        ("Bottom Left", CGPoint(x: 0.06, y: 0.62)),
        ("Bottom Right", CGPoint(x: 0.62, y: 0.62))
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            SectionHeader(title: "Picture-in-Picture")

            if let pip = viewModel.project.pictureInPicture {
                Text("Overlaying \(pip.clip.sourceURL.lastPathComponent)")
                    .font(Typography.subheadline)
                    .foregroundStyle(Theme.secondaryText)

                HStack(spacing: Spacing.sm) {
                    ForEach(cornerPresets, id: \.name) { preset in
                        Button(preset.name) {
                            var updated = pip
                            updated.frame = CGRect(origin: preset.origin, size: pip.frame.size)
                            viewModel.setPictureInPicture(updated)
                        }
                        .buttonStyle(.bordered)
                    }
                }

                SecondaryButton(title: "Remove Picture-in-Picture", systemImage: "rectangle.on.rectangle.slash") {
                    viewModel.setPictureInPicture(nil)
                }
            } else if let secondaryClip = viewModel.project.clips.dropFirst().first ?? viewModel.project.clips.first {
                Text("Overlay one of this project's clips as a small floating window.")
                    .font(Typography.subheadline)
                    .foregroundStyle(Theme.secondaryText)

                PrimaryButton(title: "Add Picture-in-Picture", systemImage: "rectangle.inset.bottomright.filled") {
                    viewModel.setPictureInPicture(PictureInPictureLayer(clip: secondaryClip, timelineStart: 0))
                }
            } else {
                Text("Add at least one more clip to use as the picture-in-picture overlay.")
                    .font(Typography.subheadline)
                    .foregroundStyle(Theme.secondaryText)
            }
        }
        .padding(Spacing.md)
    }
}

struct ExportPanel: View {
    @Bindable var viewModel: VideoEditorViewModel
    @State private var options = ExportOptions()

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.lg) {
            SectionHeader(title: "Format")
            Picker("Format", selection: $options.format) {
                ForEach(ExportFormat.allCases) { format in
                    Text(format.rawValue).tag(format)
                }
            }
            .pickerStyle(.segmented)

            SectionHeader(title: "Quality")
            Picker("Quality", selection: $options.quality) {
                ForEach(ExportOptions.Quality.allCases) { quality in
                    Text(quality.displayName).tag(quality)
                }
            }
            .pickerStyle(.segmented)

            if viewModel.isExporting {
                ProgressView(value: viewModel.exportProgress) {
                    Text("Exporting… \(Int(viewModel.exportProgress * 100))%")
                }
            } else if let url = viewModel.lastExportedURL {
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    Label("Export complete", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(Theme.success)
                    SecondaryButton(title: "Save to Photos", systemImage: "square.and.arrow.down") {
                        Task { await viewModel.saveLastExportToPhotos() }
                    }
                    ShareLink(item: url) {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }
                }
            }

            PrimaryButton(title: "Export Video", systemImage: "square.and.arrow.up", isLoading: viewModel.isExporting) {
                Task { await viewModel.export(options: options) }
            }
        }
        .padding(Spacing.md)
    }
}
