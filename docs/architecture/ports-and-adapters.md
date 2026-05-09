# Ports and Adapters

Every external dependency is accessed through a port (protocol). Adapters implement these ports. This allows swapping implementations without touching domain or application code.

## StravaActivityRepository

**Purpose**: Read and write Strava activities.

```swift
protocol StravaActivityRepository {
    func activities(since: Date) async throws -> [Activity]
    func activity(id: Int64) async throws -> Activity
    func update(_ activity: Activity, with plan: ActionPlan) async throws -> Activity
}
```

### Adapter: `StravaApiClient`

- Location: `Infrastructure/Strava/`
- Dependencies: `URLSession`, `TokenStore`
- Uses Strava OAuth2 tokens from `TokenStore`
- Maps between `StravaActivityDTO` and domain `Activity`
- Handles rate limiting with exponential backoff

---

## CorosActivityRepository

**Purpose**: Read Coros activities with their gear assignments.

```swift
protocol CorosActivityRepository {
    func activities(since: Date) async throws -> [Activity]
    func activity(id: String) async throws -> Activity
}
```

### Adapter v0: `CorosTrainingHubClient`

- Location: `Infrastructure/Coros/`
- Dependencies: `URLSession`, `TokenStore`
- Uses unofficial Training Hub API (email/password → session token)
- **Fragile**: can break without notice
- Must throw `CorosAdapterUnavailable` on auth failure, not generic errors

### Future Adapter: `CorosOpenApiClient`

- Would use official OAuth2 flow with partner credentials
- Same port, different implementation
- Swap in Composition layer without touching domain

---

## GearMappingStore

**Purpose**: Map Coros gear names to Strava gear IDs.

```swift
protocol GearMappingStore {
    func stravaGearId(forCorosGearName name: String) -> Gear.ID?
    func setMapping(corosGearName: String, stravaGearId: Gear.ID)
    func allMappings() -> [String: Gear.ID]
    func removeMapping(corosGearName: String)
}
```

### Adapter: `UserDefaultsGearMappingStore`

- Location: `Infrastructure/Keychain/` (or separate Persistence adapter)
- Simple key-value storage for the mapping table
- User configures this once: "Coros shoe X = Strava gear ID Y"

---

## TokenStore

**Purpose**: Secure storage for OAuth tokens and session credentials.

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

### Adapter: `KeychainTokenStore`

- Location: `Infrastructure/Keychain/`
- Uses iOS Keychain Services
- Wraps the Security framework's C API in a Swift-friendly interface
- No Keychain types leak past this adapter

---

## ActivityWakeSource

**Purpose**: Notify the app when a new activity may be available.

```swift
protocol ActivityWakeSource {
    var onWake: AsyncStream<WakeEvent> { get }
    func start() async throws
    func stop()
}

struct WakeEvent {
    let timestamp: Date
    let hint: ActivityHint?
}
```

### Adapter: `HealthKitWakeSource`

- Location: `Infrastructure/HealthKit/`
- Uses `HKObserverQuery` on `HKWorkoutType`
- Requests background delivery
- Fires `WakeEvent` when HealthKit reports a new workout
- The app then queries Strava for recent activities

### Adapter: `BackgroundRefreshWakeSource` (future)

- Uses `BGAppRefreshTask`
- Polls on schedule as backup when HealthKit doesn't fire

---

## RuleStore

**Purpose**: Persist and retrieve user-defined rules.

```swift
protocol RuleStore {
    func loadRules() throws -> [Rule]
    func saveRules(_ rules: [Rule]) throws
    func addRule(_ rule: Rule) throws
    func updateRule(_ rule: Rule) throws
    func deleteRule(id: UUID) throws
}
```

### Adapter: `FileRuleStore`

- Location: `Infrastructure/Persistence/` (or Composition for v0)
- Stores rules as JSON in app's documents directory
- Simple file-based storage for v0

---

## Clock

**Purpose**: Abstract time for testability.

```swift
protocol Clock {
    var now: Date { get }
}
```

### Adapter: `SystemClock`

```swift
struct SystemClock: Clock {
    var now: Date { Date() }
}
```

### Test Double: `FixedClock`

```swift
struct FixedClock: Clock {
    let now: Date
}
```

---

## Adapter Isolation Rules

1. **Adapters depend on Domain**, never the reverse
2. **Adapters do not depend on each other** — Strava adapter doesn't import Coros adapter
3. **DTOs stay inside adapters** — `StravaActivityDTO` never escapes `Infrastructure/Strava/`
4. **Errors are typed per adapter** — `CorosAdapterUnavailable`, `StravaRateLimitExceeded`
5. **Adapters are constructed in Composition** — nowhere else
