import CoreTransferable
import UniformTypeIdentifiers
import Foundation

/// `Transferable` wrapper letting a `PhotosPickerItem` (or any other
/// `Transferable`-based picker) hand back a real, locally-owned copy of a
/// picked video file — the standard recipe for importing video via
/// `PhotosPicker`, since the picker's own sandboxed file disappears once the
/// picker dismisses.
struct VideoFileTransfer: Transferable {
    let url: URL

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .movie) { video in
            SentTransferredFile(video.url)
        } importing: { received in
            let destination = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString)
                .appendingPathExtension(received.file.pathExtension.isEmpty ? "mov" : received.file.pathExtension)

            if FileManager.default.fileExists(atPath: destination.path) {
                try FileManager.default.removeItem(at: destination)
            }
            try FileManager.default.copyItem(at: received.file, to: destination)
            return Self(url: destination)
        }
    }
}
