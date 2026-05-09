# Architecture Overview

c-key follows hexagonal architecture (ports and adapters). The domain core is completely isolated from frameworks, networking, and persistence. External systems connect through ports (protocols) with concrete adapters implementing them.

## The Three Rings

```
                    ┌─────────────────────────────────────────────┐
                    │              Infrastructure                  │
                    │  ┌───────────────────────────────────────┐  │
                    │  │            Application                 │  │
                    │  │  ┌─────────────────────────────────┐  │  │
                    │  │  │            Domain                │  │  │
                    │  │  │                                  │  │  │
                    │  │  │   Activity, Rule, Filter,        │  │  │
                    │  │  │   Action, RuleEvaluation         │  │  │
                    │  │  │                                  │  │  │
                    │  │  └─────────────────────────────────┘  │  │
                    │  │                                        │  │
                    │  │   EvaluateRulesUseCase                 │  │
                    │  │   SyncGearUseCase                      │  │
                    │  │   ProcessNewActivityUseCase            │  │
                    │  │                                        │  │
                    │  └───────────────────────────────────────┘  │
                    │                                              │
                    │   StravaApiClient    CorosTrainingHubClient  │
                    │   HealthKitWakeSource  KeychainTokenStore    │
                    │                                              │
                    └─────────────────────────────────────────────┘
```

**Arrows go inward only.** Infrastructure depends on Application. Application depends on Domain. Domain depends on nothing but itself and Foundation value types.

## Why This Matters for c-key

### Coros Fragility

The Coros integration uses an unofficial, undocumented API. It can break at any time without notice. By placing it behind a port (`CorosActivityRepository`), we contain the blast radius. If Coros auth fails, the Coros adapter throws `CorosAdapterUnavailable`, and the rest of the system continues — other rules still evaluate, the app remains functional.

### Strava API Limits

Strava's API has hard limits on what we can modify. We cannot set visibility to private, delete activities, or edit map visibility. These constraints are baked into the domain's `Action` sealed type at compile time. The domain literally cannot express an action that Strava doesn't support.

### Testability

With the domain isolated, we can test rule evaluation, filter matching, and action planning without any network calls, HealthKit entitlements, or Keychain access. Tests run fast and deterministically. Adapters get their own integration tests against real APIs (or mocks of them).

## Module Structure

```
App/
├── Domain/           # Pure Swift, no imports beyond Foundation
├── Application/      # Use cases, async orchestration
├── Infrastructure/
│   ├── Strava/       # StravaApiClient
│   ├── Coros/        # CorosTrainingHubClient
│   ├── HealthKit/    # HealthKitWakeSource
│   └── Keychain/     # KeychainTokenStore
└── Composition/      # App entry, DI container, SwiftUI views
```

The `Composition` layer is the only place where concrete adapters are instantiated and injected into use cases. SwiftUI views live here too — they're part of the infrastructure from the domain's perspective.
