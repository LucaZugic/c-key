# Keychain Integration

The iOS Keychain provides secure storage for sensitive credentials. c-key stores OAuth tokens and session credentials here — never in UserDefaults, files, or code.

## What We Store

| Key | Content | Source |
|-----|---------|--------|
| `strava.access_token` | Strava OAuth2 access token | Strava auth flow |
| `strava.refresh_token` | Strava OAuth2 refresh token | Strava auth flow |
| `strava.expires_at` | Access token expiration (ISO8601) | Strava auth flow |
| `coros.session_token` | Coros Training Hub session | Coros auth flow |

## What We Never Store

- Passwords (Coros password is exchanged immediately for token, never persisted)
- API client secrets (bundled in app, not in Keychain)
- User email addresses (not needed post-auth)

## TokenStore Protocol

The domain defines the port:

```swift
protocol TokenStore {
    func get(key: TokenKey) throws -> String?
    func set(key: TokenKey, value: String) throws
    func delete(key: TokenKey) throws
}

enum TokenKey: String {
    case stravaAccessToken = "strava.access_token"
    case stravaRefreshToken = "strava.refresh_token"
    case stravaExpiresAt = "strava.expires_at"
    case corosSessionToken = "coros.session_token"
}
```

## KeychainTokenStore Adapter

The adapter wraps the Security framework:

```swift
final class KeychainTokenStore: TokenStore {
    private let service = "com.ckey.tokens"

    func get(key: TokenKey) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        switch status {
        case errSecSuccess:
            guard let data = result as? Data,
                  let string = String(data: data, encoding: .utf8) else {
                return nil
            }
            return string
        case errSecItemNotFound:
            return nil
        default:
            throw KeychainError.readFailed(status)
        }
    }

    func set(key: TokenKey, value: String) throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainError.encodingFailed
        }

        // Delete existing item first
        try? delete(key: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.writeFailed(status)
        }
    }

    func delete(key: TokenKey) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}
```

## Error Handling

```swift
enum KeychainError: Error {
    case readFailed(OSStatus)
    case writeFailed(OSStatus)
    case deleteFailed(OSStatus)
    case encodingFailed
}
```

Errors include the `OSStatus` code for debugging. Common codes:
- `errSecItemNotFound` (-25300): Item doesn't exist
- `errSecDuplicateItem` (-25299): Item already exists
- `errSecAuthFailed` (-25293): Authentication failed

## Accessibility Setting

We use `kSecAttrAccessibleAfterFirstUnlock`:

- Data accessible after device is unlocked once after boot
- Remains accessible even when locked (for background processing)
- Persists across app restarts

This is appropriate because:
- We need background access for HealthKit-triggered processing
- Tokens are less sensitive than passwords (they expire, can be revoked)

For higher security contexts, consider `kSecAttrAccessibleWhenUnlocked`, but this would break background processing.

## No Access Group (v0)

For v0, we don't use a Keychain Access Group. The app has its own Keychain namespace by default.

If we later add:
- An app extension
- A watchOS companion
- Widget sharing

Then we'd add an access group to share credentials.

## Testing

The `KeychainTokenStore` is an adapter, so domain tests don't use it. For adapter integration tests:

```swift
final class KeychainTokenStoreTests: XCTestCase {
    var store: KeychainTokenStore!

    override func setUp() {
        store = KeychainTokenStore()
        // Clean up any leftover test data
        try? store.delete(key: .stravaAccessToken)
    }

    override func tearDown() {
        try? store.delete(key: .stravaAccessToken)
    }

    func test_setAndGet_roundTrip() throws {
        try store.set(key: .stravaAccessToken, value: "test-token")
        let retrieved = try store.get(key: .stravaAccessToken)
        XCTAssertEqual(retrieved, "test-token")
    }

    func test_get_returnsNilForMissingKey() throws {
        let retrieved = try store.get(key: .stravaAccessToken)
        XCTAssertNil(retrieved)
    }
}
```

## Security Boundaries

- **Keychain types don't escape the adapter.** `OSStatus`, `SecItem*` functions, `CFDictionary` — all contained in `KeychainTokenStore`.
- **Domain uses `TokenStore` protocol.** No Security framework imports in Domain.
- **No secrets in source control.** Tests use ephemeral test values, not real tokens.
