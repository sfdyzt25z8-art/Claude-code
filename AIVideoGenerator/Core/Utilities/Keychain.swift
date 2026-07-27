import Foundation
import Security

/// Minimal Keychain wrapper for storing sensitive values (auth tokens,
/// refresh tokens) outside of `UserDefaults`, satisfying the app's
/// encrypted-storage security requirement.
struct Keychain: Sendable {
    enum KeychainError: Error {
        case unhandled(OSStatus)
    }

    let service: String

    init(service: String = "com.aivideogenerator.app") {
        self.service = service
    }

    func set(_ value: String, for key: String) throws {
        let data = Data(value.utf8)
        var query = baseQuery(for: key)
        SecItemDelete(query as CFDictionary)

        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw KeychainError.unhandled(status) }
    }

    func get(_ key: String) -> String? {
        var query = baseQuery(for: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func remove(_ key: String) {
        SecItemDelete(baseQuery(for: key) as CFDictionary)
    }

    private func baseQuery(for key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
    }
}

/// Actor-isolated store for the current session's auth token, backed by
/// Keychain so tokens survive app relaunch but never touch disk unencrypted.
protocol AuthTokenStoring: Sendable {
    func currentToken() async -> String?
    func save(token: String) async
    func clear() async
}

actor AuthTokenStore: AuthTokenStoring {
    private let keychain: Keychain
    private let key = "auth.accessToken"
    private var cachedToken: String?

    init(keychain: Keychain = Keychain()) {
        self.keychain = keychain
    }

    func currentToken() async -> String? {
        if let cachedToken { return cachedToken }
        let token = keychain.get(key)
        cachedToken = token
        return token
    }

    func save(token: String) async {
        cachedToken = token
        try? keychain.set(token, for: key)
    }

    func clear() async {
        cachedToken = nil
        keychain.remove(key)
    }
}
