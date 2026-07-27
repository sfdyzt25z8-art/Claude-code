import Photos

/// Saves an exported video to the user's Photos library, requesting
/// add-only authorization the first time it's used.
enum PhotoLibrarySaving {
    static func saveVideo(at url: URL) async throws {
        let status = await withCheckedContinuation { (continuation: CheckedContinuation<PHAuthorizationStatus, Never>) in
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                continuation.resume(returning: status)
            }
        }

        guard status == .authorized || status == .limited else {
            throw AppError.authenticationFailed("Photo library access was denied. Enable it in Settings to save your video.")
        }

        try await PHPhotoLibrary.shared().performChanges {
            PHAssetCreationRequest.creationRequestForAssetFromVideo(atFileURL: url)
        }
    }
}
