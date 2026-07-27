import Foundation
import Security

/// Thin, typed wrapper around the Keychain Services API for storing small secrets
/// (auth tokens, refresh tokens). Never stores raw passwords — those are handled
/// entirely by ASAuthorizationController / Sign in with Apple / the identity provider's SDK.
struct KeychainStore: Sendable {
    let service: String

    init(service: String = "com.aivideogenerator.app.credentials") {
        self.service = service
    }

    func set(_ value: String, for key: String) throws {
        let data = Data(value.utf8)
        var query = baseQuery(for: key)
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw AppError.storage("Unable to securely store credentials (status \(status)).")
        }
    }

    func string(for key: String) throws -> String? {
        var query = baseQuery(for: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        switch status {
        case errSecSuccess:
            guard let data = result as? Data, let value = String(data: data, encoding: .utf8) else {
                throw AppError.storage("Stored credential was unreadable.")
            }
            return value
        case errSecItemNotFound:
            return nil
        default:
            throw AppError.storage("Unable to read credentials (status \(status)).")
        }
    }

    func remove(_ key: String) throws {
        let status = SecItemDelete(baseQuery(for: key) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw AppError.storage("Unable to remove credentials (status \(status)).")
        }
    }

    private func baseQuery(for key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
    }
}
