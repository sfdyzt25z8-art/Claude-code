import Foundation

/// Central registry of configured AI backends, enabling the multi-provider
/// abstraction called out in Settings → AI Provider Selection.
///
/// Concrete production providers (e.g. wrapping a specific vendor's REST
/// API) register themselves here at app launch via `AppEnvironment`. Every
/// feature view model depends on the narrow capability protocol it needs
/// (`VideoGenerationProviding`, etc.) rather than a concrete provider type,
/// so swapping or adding a backend never touches feature code.
@MainActor
final class ProviderRegistry: ObservableObject {
    @Published private(set) var videoProviders: [any VideoGenerationProviding]
    @Published private(set) var thumbnailProviders: [any ThumbnailGenerationProviding]
    @Published private(set) var promptAssistProviders: [any PromptAssistProviding]

    @Published var selectedVideoProviderID: String {
        didSet { UserDefaults.standard.set(selectedVideoProviderID, forKey: Keys.videoProvider) }
    }
    @Published var selectedThumbnailProviderID: String {
        didSet { UserDefaults.standard.set(selectedThumbnailProviderID, forKey: Keys.thumbnailProvider) }
    }
    @Published var selectedPromptAssistProviderID: String {
        didSet { UserDefaults.standard.set(selectedPromptAssistProviderID, forKey: Keys.promptProvider) }
    }

    private enum Keys {
        static let videoProvider = "selectedVideoProviderID"
        static let thumbnailProvider = "selectedThumbnailProviderID"
        static let promptProvider = "selectedPromptAssistProviderID"
    }

    init(
        videoProviders: [any VideoGenerationProviding],
        thumbnailProviders: [any ThumbnailGenerationProviding],
        promptAssistProviders: [any PromptAssistProviding],
        userDefaults: UserDefaults = .standard
    ) {
        self.videoProviders = videoProviders
        self.thumbnailProviders = thumbnailProviders
        self.promptAssistProviders = promptAssistProviders

        self.selectedVideoProviderID = userDefaults.string(forKey: Keys.videoProvider) ?? videoProviders.first?.id ?? ""
        self.selectedThumbnailProviderID = userDefaults.string(forKey: Keys.thumbnailProvider) ?? thumbnailProviders.first?.id ?? ""
        self.selectedPromptAssistProviderID = userDefaults.string(forKey: Keys.promptProvider) ?? promptAssistProviders.first?.id ?? ""
    }

    var activeVideoProvider: (any VideoGenerationProviding)? {
        videoProviders.first { $0.id == selectedVideoProviderID } ?? videoProviders.first
    }

    var activeThumbnailProvider: (any ThumbnailGenerationProviding)? {
        thumbnailProviders.first { $0.id == selectedThumbnailProviderID } ?? thumbnailProviders.first
    }

    var activePromptAssistProvider: (any PromptAssistProviding)? {
        promptAssistProviders.first { $0.id == selectedPromptAssistProviderID } ?? promptAssistProviders.first
    }
}
