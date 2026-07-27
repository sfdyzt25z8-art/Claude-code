import SwiftUI

/// Sound tool: AI narration (fully working — synthesized on-device), plus
/// music and ambient pickers whose catalogs are real but whose entries have
/// no bundled audio yet (see `MockMusicLibrary`/`AmbientSoundLibrary`).
/// Existing audio tracks are listed with volume/fade/mute controls.
struct SoundPanel: View {
    @Bindable var viewModel: VideoEditorViewModel
    @State private var narrationText = ""
    @State private var musicLibrary: [MusicTrackInfo] = []
    private let musicProvider: MusicLibraryProviding = MockMusicLibrary()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                narrationSection
                musicSection
                ambientSection
                if !viewModel.project.audioTracks.isEmpty {
                    tracksSection
                }
            }
            .padding(Spacing.md)
        }
        .task {
            musicLibrary = (try? await musicProvider.allTracks()) ?? []
        }
    }

    private var narrationSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "AI Narration")
            GlassCard {
                TextEditor(text: $narrationText)
                    .frame(minHeight: 80)
                    .scrollContentBackground(.hidden)
                    .font(Typography.body)
            }
            PrimaryButton(
                title: "Generate Narration",
                systemImage: "waveform",
                isLoading: viewModel.isSynthesizingNarration,
                isEnabled: !narrationText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ) {
                Task {
                    await viewModel.synthesizeNarration(text: narrationText)
                    narrationText = ""
                }
            }
        }
    }

    private var musicSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Background Music")
            if musicLibrary.isEmpty {
                EmptyStateRow(message: "Loading music catalog…")
            } else {
                ForEach(musicLibrary) { track in
                    Button {
                        guard let assetURL = track.assetURL else { return }
                        viewModel.addAudioTrack(AudioTrack(kind: .music, sourceURL: assetURL, displayName: track.title, duration: track.duration))
                    } label: {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(track.title).font(Typography.subheadline)
                                Text(track.artist).font(Typography.caption).foregroundStyle(Theme.secondaryText)
                            }
                            Spacer()
                            Text(track.duration.formattedDuration).font(Typography.caption).foregroundStyle(Theme.secondaryText)
                        }
                    }
                    .disabled(track.assetURL == nil)
                    .opacity(track.assetURL == nil ? 0.4 : 1)
                }
                Text("Music playback needs licensed audio files this build doesn't bundle yet.")
                    .font(Typography.caption)
                    .foregroundStyle(Theme.secondaryText)
            }
        }
    }

    private var ambientSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Ambient Sound")
            ChipSelector(
                options: AmbientSoundType.allCases,
                selection: .constant([]),
                label: { $0.displayName },
                systemImage: { $0.symbolName }
            )
            .disabled(true)
            .opacity(0.5)
            Text("Ambient loops need bundled audio this build doesn't include yet.")
                .font(Typography.caption)
                .foregroundStyle(Theme.secondaryText)
        }
    }

    private var tracksSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            SectionHeader(title: "Tracks")
            ForEach(viewModel.project.audioTracks) { track in
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    HStack {
                        Label(track.displayName, systemImage: track.kind == .narration ? "waveform" : (track.kind == .music ? "music.note" : "leaf"))
                            .font(Typography.subheadline)
                        Spacer()
                        Button(role: .destructive) {
                            viewModel.removeAudioTrack(id: track.id)
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                    HStack {
                        Image(systemName: "speaker.wave.2")
                        Slider(
                            value: Binding(
                                get: { track.volume },
                                set: { newValue in
                                    var updated = track
                                    updated.volume = newValue
                                    viewModel.updateAudioTrack(updated)
                                }
                            ),
                            in: 0...1
                        )
                    }
                }
                .padding(.vertical, Spacing.xxs)
            }
        }
    }
}
