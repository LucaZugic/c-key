# ADR 0005: Test-Driven Development and Domain-Driven Design

## Status

Accepted

## Date

2025-01-15

## Context

c-key has a non-trivial domain: rules, filters, actions, evaluation, conflict resolution. It integrates with fragile external APIs. The developer works alone, so there's no pair to catch mistakes.

We need practices that:
- Catch bugs early
- Make the code understandable
- Enable confident refactoring
- Document behavior through tests

## Decision

We commit to Test-Driven Development (TDD) and Domain-Driven Design (DDD) as core working practices.

### TDD

Every piece of production code is driven by a failing test. The red-green-refactor cycle is mandatory:

1. Write a failing test
2. Make it pass with minimal code
3. Refactor with tests green

No exceptions for "exploratory" code. Spikes have tests too.

### DDD

We use DDD tactical patterns:
- **Ubiquitous language**: Terms defined in glossary, used everywhere
- **Value objects**: `Distance`, `Duration`, `Gear`, `Sport`
- **Entities**: `Rule`
- **Aggregates**: `Activity` (root), `Rule` (root)
- **Domain events**: `ActivityImported`, `ActionExecuted`, etc.
- **Repositories**: Ports for external data access

The domain layer is pure — no framework dependencies.

## Consequences

### Positive

- High test coverage by construction, not afterthought
- Bugs caught at compile time or test time, rarely production
- Refactoring is safe — tests catch regressions
- Domain model is explicit and understandable
- Ubiquitous language reduces confusion
- Tests document expected behavior

### Negative

- Slower initial development (writing tests takes time)
- Requires discipline to maintain (tempting to skip tests)
- More code overall (production + tests)
- DDD can feel over-engineered for simple features

### Neutral

- Test infrastructure needs setup (fixtures, factories)
- Some learning curve for unfamiliar developers
- Balance needed between "enough" DDD and over-modeling
