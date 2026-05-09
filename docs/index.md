# c-key Documentation

c-key is an iOS app that automates post-processing of Strava activities through a user-configurable rules engine. When a new activity lands, the app evaluates filters against it and applies actions — setting gear, muting activities from feeds, changing sport types, and more. The flagship feature is automatic propagation of Coros gear assignments to Strava, solving a gap that neither platform addresses natively.

The app runs entirely on-device. There is no backend, no server, no cloud function, and no recurring infrastructure cost. A single user (the developer) is the target for v0. The architecture is hexagonal, with the domain core isolated from all framework dependencies, and adapters for Strava, Coros, HealthKit, and Keychain sitting behind ports.

---

## Documentation Sections

### [Architecture](architecture/overview.md)

How the system is structured. Hexagonal layers, dependency rules, ports and adapters, and the domain model.

- [Overview](architecture/overview.md) — the big picture
- [Hexagonal Layers](architecture/hexagonal-layers.md) — what lives where
- [Domain Model](architecture/domain-model.md) — types and relationships
- [Ports and Adapters](architecture/ports-and-adapters.md) — interfaces and implementations
- [Dependency Rules](architecture/dependency-rules.md) — what may import what

### [Domain](domain/ubiquitous-language.md)

The language and concepts of the problem space.

- [Ubiquitous Language](domain/ubiquitous-language.md) — glossary of terms
- [Aggregates](domain/aggregates.md) — aggregate roots and invariants
- [Domain Events](domain/domain-events.md) — what happens when

### [Integrations](integrations/strava.md)

How c-key connects to external systems.

- [Strava](integrations/strava.md) — OAuth, capabilities, and limits
- [Coros](integrations/coros.md) — unofficial API, fragility, isolation
- [HealthKit](integrations/healthkit.md) — background wake on new activity
- [Keychain](integrations/keychain.md) — secure token storage

### [Ways of Working](ways-of-working/tdd.md)

How we build software in this project.

- [TDD](ways-of-working/tdd.md) — the red-green-refactor loop
- [Commits](ways-of-working/commits.md) — conventions and examples
- [Code Review Checklist](ways-of-working/code-review-checklist.md) — two-pass review
- [Clean Code](ways-of-working/clean-code.md) — principles applied to Swift
- [Definition of Done](ways-of-working/definition-of-done.md) — when is a change complete

### [Product](product/vision.md)

What we're building and why.

- [Vision](product/vision.md) — the problem and the solution
- [Rules Engine](product/rules-engine.md) — filters, actions, evaluation
- [Roadmap](product/roadmap.md) — spikes and slices

### [Decisions](decisions/0000-template.md)

Architecture Decision Records capturing major choices.

- [ADR Template](decisions/0000-template.md)
- [ADR 0001: iOS Native SwiftUI](decisions/0001-ios-native-swiftui.md)
- [ADR 0002: On-Device Only](decisions/0002-on-device-only-no-backend.md)
- [ADR 0003: Hexagonal Architecture](decisions/0003-hexagonal-architecture.md)
- [ADR 0004: Coros Unofficial API](decisions/0004-coros-unofficial-api-for-v0.md)
- [ADR 0005: TDD and DDD](decisions/0005-tdd-and-ddd.md)
- [ADR 0006: Mute Not Private](decisions/0006-mute-not-private-strava-limitation.md)
