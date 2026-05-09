# ADR-0003: Hexagonal Architecture

## Status

Accepted

## Context

The rules engine needs to run in multiple environments:
- iOS Shortcuts runtime (JavaScriptCore)
- Node.js (for testing with Vitest)
- Potentially a future native iOS app
- Potentially a web browser

If the engine is tightly coupled to any specific runtime (e.g., uses Node's `fs` or DOM APIs), it cannot run elsewhere without modification.

Hexagonal architecture (ports and adapters) solves this by:
1. Keeping the domain core free of external dependencies
2. Defining ports (interfaces) for external communication
3. Implementing adapters for each runtime

## Decision

Structure the TypeScript codebase using hexagonal architecture:

- `src/domain/`: Pure types and functions. Imports nothing external.
- `src/application/`: Use cases. Imports domain and port interfaces only.
- `src/infrastructure/`: Adapters implementing ports. May use runtime APIs.
- `src/entry/`: Composition root. Wires everything together.

The domain layer is the innermost core. It has no knowledge of HTTP, file systems, databases, or UI. All such concerns are pushed to the infrastructure layer.

## Consequences

**Benefits**:
- Domain logic is testable without mocks (use fake adapters)
- Engine runs in any JavaScript environment
- Future native iOS app can reuse the domain via JavaScript bridge or port to Swift
- Clear separation of concerns
- Easy to swap implementations (e.g., different storage adapter)

**Drawbacks**:
- More files and indirection
- Discipline required to maintain layer boundaries (no automated enforcement)
- Overhead for small projects (but c-key will grow)

**Trade-off accepted**: The portability and testability benefits justify the structural overhead.

## Date

2026-05-09
