import Foundation

struct StorageUsage: Equatable, Sendable {
    var usedBytes: Int64
    var quotaBytes: Int64

    var fraction: Double {
        guard quotaBytes > 0 else { return 0 }
        return min(1, Double(usedBytes) / Double(quotaBytes))
    }

    var formattedUsed: String { Self.formatter.string(fromByteCount: usedBytes) }
    var formattedQuota: String { Self.formatter.string(fromByteCount: quotaBytes) }

    private static let formatter: ByteCountFormatter = {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter
    }()
}

protocol StorageUsageServiceProtocol: Sendable {
    func currentUsage(quotaBytes: Int64) async -> StorageUsage
}

/// Computes on-device storage consumption by summing the app's Documents
/// directory (locally cached / exported projects). The quota itself comes
/// from the account's `AccountEntitlements`, since storage limits are
/// subscription-tier dependent and backend-authoritative.
struct StorageUsageService: StorageUsageServiceProtocol {
    private let fileManager: FileManager

    init(fileManager: FileManager = .default) {
        self.fileManager = fileManager
    }

    func currentUsage(quotaBytes: Int64) async -> StorageUsage {
        let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let usedBytes = await Task.detached(priority: .utility) {
            directorySize(at: documents, fileManager: fileManager)
        }.value
        return StorageUsage(usedBytes: usedBytes, quotaBytes: quotaBytes)
    }
}

private func directorySize(at url: URL, fileManager: FileManager) -> Int64 {
    guard let enumerator = fileManager.enumerator(
        at: url,
        includingPropertiesForKeys: [.fileSizeKey],
        options: [.skipsHiddenFiles]
    ) else { return 0 }

    var total: Int64 = 0
    for case let fileURL as URL in enumerator {
        if let size = try? fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize {
            total += Int64(size)
        }
    }
    return total
}
