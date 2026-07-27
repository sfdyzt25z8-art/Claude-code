import Foundation

/// Parameters for a thumbnail generation request.
struct ThumbnailRequest: Identifiable, Codable, Sendable, Hashable {
    let id: UUID
    var prompt: String
    var style: ThumbnailStyle
    var titleText: String
    var aspectRatio: VideoAspectRatio

    init(id: UUID = UUID(), prompt: String = "", style: ThumbnailStyle = .realistic, titleText: String = "", aspectRatio: VideoAspectRatio = .widescreen) {
        self.id = id
        self.prompt = prompt
        self.style = style
        self.titleText = titleText
        self.aspectRatio = aspectRatio
    }

    var isValid: Bool {
        !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

/// A generated thumbnail candidate with layout guidance so the UI can render
/// text-placement and contrast suggestions over the artwork.
struct ThumbnailResult: Identifiable, Codable, Sendable, Equatable {
    struct TextPlacement: Codable, Sendable, Equatable {
        /// Normalized (0...1) rect within the thumbnail bounds.
        var x: Double
        var y: Double
        var width: Double
        var height: Double
        var suggestedTextColorHex: String
        var suggestedBackdropOpacity: Double
    }

    let id: UUID
    var imageURL: URL?
    var titlePlacement: TextPlacement
    var dominantColorHex: String
    var contrastScore: Double

    init(id: UUID = UUID(), imageURL: URL? = nil, titlePlacement: TextPlacement, dominantColorHex: String, contrastScore: Double) {
        self.id = id
        self.imageURL = imageURL
        self.titlePlacement = titlePlacement
        self.dominantColorHex = dominantColorHex
        self.contrastScore = contrastScore
    }
}
