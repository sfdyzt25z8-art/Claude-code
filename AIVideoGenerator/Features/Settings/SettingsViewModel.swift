import Foundation

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published private(set) var storageUsage = StorageUsage(usedBytes: 0, quotaBytes: 5_000_000_000)
    @Published private(set) var isSigningOut = false

    private let storageUsageService: StorageUsageServiceProtocol
    private let authService: MockAuthService

    init(storageUsageService: StorageUsageServiceProtocol, authService: MockAuthService) {
        self.storageUsageService = storageUsageService
        self.authService = authService
    }

    var currentUser: User? { authService.currentUser }

    func load() async {
        storageUsage = await storageUsageService.currentUsage(quotaBytes: storageUsage.quotaBytes)
    }

    func signOut() async {
        isSigningOut = true
        defer { isSigningOut = false }
        await authService.signOut()
    }
}
