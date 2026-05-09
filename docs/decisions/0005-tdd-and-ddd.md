# ADR-0005: Test-Driven Development and Domain-Driven Design

## Status

Accepted

## Context

The rules engine is the core of c-key. It must:
- Correctly evaluate filters against activity data
- Produce accurate action plans
- Handle edge cases without crashing
- Be maintainable as rules and features are added

These requirements demand high confidence in the code. Manual testing is insufficient because:
- The Shortcuts runtime is hard to debug
- Edge cases are numerous (distance boundaries, sport types, gear states)
- Regressions can silently break user workflows

Domain-Driven Design provides a framework for modeling the problem space with clear boundaries, a ubiquitous language, and explicit aggregates.

## Decision

Adopt TDD and DDD as the working method for all c-key development.

**TDD**:
- Write a failing test before any production code
- Make the test pass with the smallest change
- Refactor while keeping tests green
- No production code exists without a test driving it

**DDD**:
- Define a ubiquitous language (Activity, Rule, Filter, Action, etc.)
- Model the domain with aggregates (Activity, Rule)
- Use discriminated unions for type-safe exhaustive handling (Filter, Action)
- Keep the domain pure (no I/O, no framework dependencies)

## Consequences

**Benefits**:
- High test coverage by construction
- Tests document expected behavior
- Refactoring is safe (tests catch regressions)
- Domain model is explicit and shared
- Code aligns with problem-space concepts

**Drawbacks**:
- Slower initial development (tests take time)
- Discipline required (easy to skip tests under pressure)
- Learning curve for developers unfamiliar with TDD/DDD
- Risk of over-engineering if DDD is applied too rigidly

**Mitigations**:
- Start simple: three rules, straightforward filters
- Avoid speculative abstractions
- Review tests for redundancy (don't over-test)

## Date

2026-05-09
