# Hexagonal Layers

Each layer has specific responsibilities and import restrictions. Violating these boundaries is a test failure caught in code review.

## Domain Layer (`App/Domain/`)

### What Lives Here

- **Value objects**: `Sport`, `Gear`, `Distance`, `Duration`, `ActivitySource`
- **Entities**: `Rule`
- **Aggregate roots**: `Activity`
- **Domain services**: `RuleEvaluation`
- **Sealed types**: `Filter`, `Action`
- **Domain events**: `ActivityImported`, `RuleEvaluated`, `ActionExecuted`, `ActionFailed`
- **Port protocols**: `StravaActivityRepository`, `CorosActivityRepository`, `GearMappingStore`, `TokenStore`, `RuleStore`, `Clock`

### May Import

- `Foundation` value types only: `Date`, `URL`, `UUID`, `Decimal`, `Data`, `TimeInterval`
- Other Domain types

### Must NOT Import

- `Combine`
- `SwiftUI` or `UIKit`
- `HealthKit`
- `Security` (Keychain)
- `URLSession` or any networking
- Third-party SDKs
- Anything from `Application/` or `Infrastructure/`

### Example Types

```swift
// Value object
struct Distance: Equatable, Hashable {
    let meters: Double
}

// Sealed type (enum with associated values)
enum Filter {
    case sportEquals(Sport)
    case distanceBetween(min: Distance, max: Distance)
    case corosGearAttached
}

// Port protocol
protocol CorosActivityRepository {
    func activities(since: Date) async throws -> [Activity]
}
```

---

## Application Layer (`App/Application/`)

### What Lives Here

- **Use cases**: `EvaluateRulesUseCase`, `SyncGearUseCase`, `ProcessNewActivityUseCase`
- **Orchestration logic**: coordinating multiple domain operations
- **Application services**: cross-cutting concerns like logging hooks

### May Import

- Everything from `Domain/`
- `Combine` for reactive orchestration
- `Swift Concurrency` (`async`/`await`, `Task`)

### Must NOT Import

- `SwiftUI` or `UIKit`
- `HealthKit`
- `Security`
- `URLSession`
- Concrete adapter types
- Third-party SDKs

### Example Types

```swift
final class ProcessNewActivityUseCase {
    private let stravaRepo: StravaActivityRepository
    private let corosRepo: CorosActivityRepository
    private let ruleStore: RuleStore
    private let evaluation: RuleEvaluation

    func execute(activityId: Activity.ID) async throws {
        // Orchestrate: fetch activity, evaluate rules, apply actions
    }
}
```

---

## Infrastructure Layer (`App/Infrastructure/`)

### What Lives Here

- **Adapters** implementing ports: `StravaApiClient`, `CorosTrainingHubClient`, `KeychainTokenStore`, `HealthKitWakeSource`
- **DTOs**: data transfer objects for JSON parsing
- **API clients**: HTTP networking code
- **Platform integrations**: HealthKit, Keychain

### May Import

- Everything from `Domain/` (to implement port protocols)
- `Foundation` networking (`URLSession`)
- Framework-specific imports for its subdomain:
    - `Infrastructure/Strava/`: networking only
    - `Infrastructure/Coros/`: networking only
    - `Infrastructure/HealthKit/`: `HealthKit` framework
    - `Infrastructure/Keychain/`: `Security` framework

### Must NOT Import

- `SwiftUI` (that's Composition)
- Other adapters (Strava adapter doesn't import Coros adapter)
- Types from `Application/` layer

### Example Types

```swift
// Adapter implementing a port
final class StravaApiClient: StravaActivityRepository {
    func activities(since: Date) async throws -> [Activity] {
        // URLSession calls, JSON parsing, map DTOs to domain types
    }
}

// DTO (internal to adapter)
struct StravaActivityDTO: Decodable {
    let id: Int64
    let name: String
    let sport_type: String
    // ...
}
```

---

## Composition Layer (`App/Composition/`)

### What Lives Here

- **App entry point**: `@main` struct
- **Dependency injection**: constructing and wiring all adapters and use cases
- **SwiftUI views**: all UI code
- **View models**: if needed, bridging use cases to views
- **Background task registration**: `BGTaskScheduler`

### May Import

- Everything — this is the composition root

### Must NOT

- Contain business logic (that belongs in Domain or Application)
- Be imported by any other layer

### Example

```swift
@main
struct CKeyApp: App {
    let container = DependencyContainer()

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: container.makeContentViewModel())
        }
    }
}

final class DependencyContainer {
    private lazy var tokenStore = KeychainTokenStore()
    private lazy var stravaClient = StravaApiClient(tokenStore: tokenStore)
    // ... wire everything together
}
```
