# ADR 0003: Hexagonal Architecture

## Status

Accepted

## Date

2025-01-15

## Context

c-key integrates with multiple external systems:
- Strava API (OAuth, activity read/write)
- Coros Training Hub API (unofficial, fragile)
- HealthKit (background wake)
- iOS Keychain (token storage)

The Coros integration is particularly risky. It uses an unofficial, undocumented API that can break at any time. We need an architecture that:

1. Isolates the domain logic from external systems
2. Contains failures in one integration from affecting others
3. Allows swapping implementations (e.g., Coros unofficial → official API)
4. Enables testing domain logic without real API calls

## Decision

We use hexagonal architecture (ports and adapters).

**Domain layer**: Pure business logic. Rules, filters, actions, evaluation. No imports from frameworks, networking, or SDKs.

**Application layer**: Use cases orchestrating domain logic. May use async/await and Combine for coordination.

**Infrastructure layer**: Adapters implementing ports. Each adapter handles one external system.

**Composition layer**: Wires everything together. SwiftUI views live here.

Dependencies point inward. Infrastructure depends on Domain, never the reverse.

## Consequences

### Positive

- Domain logic is testable without mocks of URLSession, HealthKit, etc.
- Coros adapter failure is contained — other rules still evaluate
- Swapping Coros unofficial API for official API requires only a new adapter
- Clear boundaries make the codebase navigable
- Enforces thinking about interfaces before implementations

### Negative

- More files and folders than a simpler structure
- Requires discipline to maintain boundaries (easy to violate)
- Indirection can make tracing code flow harder initially
- Some boilerplate for port protocols

### Neutral

- Need to define ports explicitly, which forces design thinking
- Test doubles (fakes) needed for each port
