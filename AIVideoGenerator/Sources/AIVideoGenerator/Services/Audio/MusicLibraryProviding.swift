import Foundation

/// One entry in the royalty-free music catalog offered in the Sound picker.
struct MusicTrackInfo: Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let artist: String
    let duration: TimeInterval
    let assetURL: URL?
}

/// Looks up the royalty-free music catalog. `MockMusicLibrary` lists real
/// metadata but resolves every `assetURL` to `nil` — this build doesn't bundle
/// or license any audio files, so picking a track surfaces that plainly
/// instead of silently producing a track with no sound. Wiring a real catalog
/// means implementing this protocol against a licensed audio CDN and
/// bundling/streaming the files.
protocol MusicLibraryProviding: Sendable {
    func allTracks() async throws -> [MusicTrackInfo]
}

struct MockMusicLibrary: MusicLibraryProviding {
    func allTracks() async throws -> [MusicTrackInfo] {
        [
            MusicTrackInfo(id: "uplifting-corporate", title: "Uplifting Corporate", artist: "Preview Studio", duration: 128, assetURL: nil),
            MusicTrackInfo(id: "cinematic-tension", title: "Cinematic Tension", artist: "Preview Studio", duration: 96, assetURL: nil),
            MusicTrackInfo(id: "lofi-chill", title: "Lo-Fi Chill", artist: "Preview Studio", duration: 142, assetURL: nil),
            MusicTrackInfo(id: "epic-trailer", title: "Epic Trailer", artist: "Preview Studio", duration: 88, assetURL: nil)
        ]
    }
}

/// Looks up the bundled ambient-sound loop for a given `AmbientSoundType`.
/// Like `MockMusicLibrary`, this always returns `nil` today — see its doc
/// comment for what shipping real ambience requires.
enum AmbientSoundLibrary {
    static func assetURL(for type: AmbientSoundType) -> URL? {
        Bundle.main.url(forResource: type.rawValue, withExtension: "m4a", subdirectory: "AmbientLoops")
    }
}
