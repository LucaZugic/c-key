# Dependency Rules

These rules are non-negotiable. Violating them is a code review failure. The hexagonal architecture only works if these boundaries hold.

## The Core Rule

**Dependencies point inward.** Outer layers depend on inner layers. Inner layers never depend on outer layers.

```
Infrastructure → Application → Domain → (nothing)
```

## Layer-Specific Rules

### Domain

**May import:**

- `Foundation` value types only:
    - `Date`, `DateComponents`, `Calendar`
    - `URL`
    - `UUID`
    - `Decimal`
    - `Data`
    - `TimeInterval`
    - `Locale` (for formatting hints, not for I/O)
- Other types within `Domain/`

**Must NOT import:**

- `Combine` — reactive streams are Application-layer orchestration
- `SwiftUI`, `UIKit` — UI is Infrastructure/Composition
- `HealthKit` — platform SDK, belongs in adapter
- `Security` — Keychain is Infrastructure
- `URLSession`, `URLRequest` — networking is Infrastructure
- Any third-party package
- Any type from `Application/` or `Infrastructure/`

**Verification:** Before every commit touching `Domain/`, grep the file for forbidden imports:

```bash
grep -E "^import (Combine|SwiftUI|UIKit|HealthKit|Security)" App/Domain/
```

This must return nothing.

### Application

**May import:**

- Everything from `Domain/`
- `Combine` — for reactive orchestration
- `Swift Concurrency` (`async`/`await`, `Task`, `Actor`)

**Must NOT import:**

- `SwiftUI`, `UIKit`
- `HealthKit`
- `Security`
- `URLSession`
- Concrete adapter types (only port protocols)
- Third-party SDKs

Use cases receive ports (protocols) via initializer injection. They never construct adapters themselves.

### Infrastructure

**May import:**

- Everything from `Domain/` (to implement ports)
- Framework-specific imports scoped to the adapter:
    - `Strava/`: `Foundation` networking
    - `Coros/`: `Foundation` networking
    - `HealthKit/`: `HealthKit` framework
    - `Keychain/`: `Security` framework

**Must NOT import:**

- Types from `Application/`
- Other adapters — `Strava/` doesn't import `Coros/`
- `SwiftUI` — that's Composition

Each adapter subdirectory is its own island. Cross-adapter dependencies indicate a design problem.

### Composition

**May import:** Everything. This is the wiring layer.

**Must NOT:**

- Contain business logic — that belongs in Domain or Application
- Be imported by any other layer

---

## Why These Rules Matter

### Coros Fragility

The Coros unofficial API will break. When it does:

- `CorosTrainingHubClient` throws `CorosAdapterUnavailable`
- Use case catches it, logs it, skips gear-sync rule
- Other rules still evaluate
- UI shows a warning
- Domain logic is untouched

If Coros types leaked into Domain, a Coros API change could break rule evaluation for all rules, not just gear sync.

### Strava API Limits

Strava cannot do everything. By constraining `Action` in Domain to only proven capabilities, we get compile-time enforcement. If someone tries to add `Action.makePrivate`, the code won't compile until `docs/integrations/strava.md` documents the capability (which it can't, because it doesn't exist).

### Testability

Domain tests need no mocks of `URLSession`, no Keychain entitlements, no HealthKit simulator setup. They test pure logic with in-memory fakes.

Application tests inject fake adapters implementing ports. Fast, deterministic, no network.

Infrastructure tests can hit real APIs in integration tests, or use recorded responses.

---

## Enforcement Checklist

Before committing, verify:

- [ ] `Domain/` has no forbidden imports
- [ ] `Application/` doesn't import concrete adapters
- [ ] `Infrastructure/` adapters don't import each other
- [ ] No `SwiftUI` outside `Composition/`
- [ ] No direct `URLSession` usage in `Application/` or `Domain/`
- [ ] All port protocols are defined in `Domain/`, not `Infrastructure/`

---

## Allowed Foundation Value Types in Domain

For reference, these are the only `Foundation` types Domain may use:

| Type | Use case |
|------|----------|
| `Date` | Timestamps |
| `DateComponents` | Time-of-day filters |
| `Calendar` | Date arithmetic |
| `TimeInterval` | Durations |
| `URL` | Identifiers (not for I/O) |
| `UUID` | Entity IDs |
| `Decimal` | Precise numeric values |
| `Data` | Raw bytes (rare) |
| `Locale` | Formatting hints |

If you need something not on this list, it probably belongs in an adapter.
