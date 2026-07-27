import SwiftUI

struct SoundPanel: View {
    let soundAssets: [SoundAsset]
    let onAddAmbient: (AmbientSound) -> Void
    let onRemove: (SoundAsset.ID) -> Void
    let onVolumeChange: (Double, SoundAsset.ID) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
            Text("Ambient Sounds")
                .font(.AIVG.footnote)
                .foregroundStyle(Theme.Colors.textSecondary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.xSmall) {
                    ForEach(AmbientSound.allCases) { sound in
                        Button {
                            onAddAmbient(sound)
                        } label: {
                            Label(sound.displayName, systemImage: sound.systemImage)
                                .font(.AIVG.footnote)
                                .padding(.horizontal, Theme.Spacing.small)
                                .padding(.vertical, 6)
                                .background(.ultraThinMaterial, in: Capsule())
                        }
                    }
                }
            }

            if !soundAssets.isEmpty {
                Divider()
                ForEach(soundAssets) { asset in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(asset.name).font(.AIVG.subheadline)
                            Slider(value: Binding(
                                get: { asset.volume },
                                set: { onVolumeChange($0, asset.id) }
                            ), in: 0...1)
                        }
                        Button {
                            onRemove(asset.id)
                        } label: {
                            Image(systemName: "trash").foregroundStyle(Theme.Colors.danger)
                        }
                    }
                }
            }
        }
    }
}

struct SubtitlesPanel: View {
    let subtitles: [SubtitleCue]
    let playheadTime: TimeInterval
    let onAdd: (String) -> Void
    let onRemove: (SubtitleCue.ID) -> Void

    @State private var text = ""

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.small) {
            HStack {
                TextField("Caption text at \(String(format: "%.1f", playheadTime))s", text: $text)
                    .textFieldStyle(.roundedBorder)
                Button("Add") {
                    guard !text.isEmpty else { return }
                    onAdd(text)
                    text = ""
                }
            }

            ForEach(subtitles) { cue in
                HStack {
                    Text(String(format: "%.1fs", cue.startTime))
                        .font(.AIVG.caption)
                        .foregroundStyle(Theme.Colors.textSecondary)
                        .frame(width: 44, alignment: .leading)
                    Text(cue.text)
                        .font(.AIVG.footnote)
                        .lineLimit(1)
                    Spacer()
                    Button {
                        onRemove(cue.id)
                    } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.Colors.textTertiary)
                    }
                }
            }
        }
    }
}
