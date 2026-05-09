# c-key Documentation

c-key is an iOS Shortcut backed by a versioned TypeScript rules engine that automates post-processing of Strava activities. The headline feature is automatic shoe tagging based on distance, sport type, and other heuristics. It works with any watch or device that uploads to Strava.

The architecture splits into two halves: a thin iOS Shortcut that handles platform concerns (OAuth, HealthKit triggers, token storage, HTTP requests), and a pure TypeScript rules engine that contains all domain logic. The Shortcut fetches the engine at runtime from GitHub Pages, evaluates rules locally, and executes the resulting action plan against the Strava API. Nothing is sent to a backend server.

## Documentation Sections

### Architecture
- [Overview](architecture/overview.md) - High-level system diagram
- [Two Halves](architecture/two-halves.md) - Shortcut vs. rules engine split
- [Hexagonal Layers](architecture/hexagonal-layers.md) - Layer responsibilities and import rules
- [Domain Model](architecture/domain-model.md) - Core types and aggregates
- [Ports and Adapters](architecture/ports-and-adapters.md) - Interface definitions
- [Dependency Rules](architecture/dependency-rules.md) - What can import what

### Domain
- [Ubiquitous Language](domain/ubiquitous-language.md) - Glossary of terms
- [Aggregates](domain/aggregates.md) - Aggregate roots and boundaries
- [Domain Events](domain/domain-events.md) - Events raised by the domain

### Integrations
- [Strava](integrations/strava.md) - OAuth, endpoints, capabilities
- [Shortcuts Runtime](integrations/shortcuts-runtime.md) - JavaScript execution environment
- [HealthKit](integrations/healthkit.md) - Workout end trigger
- [Data Jar](integrations/data-jar.md) - Token and config storage

### Ways of Working
- [TDD](ways-of-working/tdd.md) - Test-driven development workflow
- [Commits](ways-of-working/commits.md) - Commit message conventions
- [Code Review Checklist](ways-of-working/code-review-checklist.md) - Review criteria
- [Clean Code](ways-of-working/clean-code.md) - Code style principles
- [Definition of Done](ways-of-working/definition-of-done.md) - Completion criteria

### Product
- [Vision](product/vision.md) - Why c-key exists
- [Rules Engine](product/rules-engine.md) - How rules work
- [Shortcut Flow](product/shortcut-flow.md) - Step-by-step Shortcut design
- [Roadmap](product/roadmap.md) - Development phases

### Distribution
- [User Setup](distribution/user-setup.md) - Installation guide
- [Strava App Registration](distribution/strava-app-registration.md) - Per-user app setup
- [Publishing](distribution/publishing.md) - Where c-key is distributed

### Decisions
- [ADR Template](decisions/0000-template.md)
- [ADR Index](decisions/) - All architectural decision records
