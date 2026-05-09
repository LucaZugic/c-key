# Code Review Checklist

Every change goes through a two-pass review. This catches issues that slip past the first look.

## Pass 1: Architecture and Clean Code

### Hexagonal Architecture

- [ ] **Domain layer has no forbidden imports.** Check for `Combine`, `SwiftUI`, `UIKit`, `HealthKit`, `Security`, `URLSession`. Grep the changed files.
- [ ] **Ports are protocols in Domain.** Concrete implementations are in Infrastructure.
- [ ] **Adapters don't import each other.** `Strava/` doesn't import `Coros/`.
- [ ] **DTOs stay inside adapters.** `StravaActivityDTO` doesn't escape `Infrastructure/Strava/`.
- [ ] **Use cases receive ports, not concrete adapters.** Injection via initializer.

### Clean Code

- [ ] **Functions are small.** Under 20 lines, ideally under 10. Extract if larger.
- [ ] **Names reveal intent.** Can you understand the code without comments?
- [ ] **No flag arguments.** `process(shouldValidate: Bool)` → split into two methods.
- [ ] **No primitive obsession.** `String` for IDs, raw numbers for distances → use value objects.
- [ ] **No feature envy.** Method uses more of another object's data than its own → move it.
- [ ] **Single responsibility.** Each function/class does one thing.

### General

- [ ] **No commented-out code.** Delete it. Git has history.
- [ ] **No `TODO` without issue link.** If it's worth noting, it's worth tracking.
- [ ] **No secrets.** Tokens, passwords, API keys — none in code or tests.
- [ ] **Errors are typed.** Not bare `Error` or `throws`. Specific error enums.

---

## Pass 2: Fresh Eyes

After completing pass 1, look again with a different mindset.

### Subtle Leaks

- [ ] **Framework types in method signatures.** `func process(_ request: URLRequest)` in Application layer → the adapter should consume this, not the use case.
- [ ] **Combine publishers escaping Domain.** Domain can define callbacks or use `async`, not `AnyPublisher`.
- [ ] **SwiftUI types in view models.** View models are Application; they shouldn't import SwiftUI.

### Code Smells

- [ ] **Long parameter lists.** More than 3 parameters → introduce a parameter object.
- [ ] **Data clumps.** Same group of parameters appears in multiple places → extract a type.
- [ ] **Speculative generality.** Abstraction for "future flexibility" with one implementation → remove it.
- [ ] **Premature abstraction.** Protocol with one conformer and no planned second → inline it.
- [ ] **Shotgun surgery.** One change requires touching many files → consider redesign.

### Naming

- [ ] **Vague names.** `data`, `info`, `manager`, `handler`, `helper` → be specific.
- [ ] **Misleading names.** `isValid` returns a `Result` → rename.
- [ ] **Inconsistent vocabulary.** `fetch` vs `get` vs `retrieve` → pick one per context.

### Boundaries

- [ ] **Strava actions within proven capabilities.** No `makePrivate`, `delete`, `editMapVisibility`.
- [ ] **Coros types contained.** Nothing from Coros adapter escapes to Domain.
- [ ] **Error handling at boundaries.** Adapters catch low-level errors, translate to domain errors.

---

## Test Review

Separate from code review, but equally important.

- [ ] **Tests assert behavior, not implementation.** Testing the public interface, not private methods.
- [ ] **Test names read as sentences.** `test_distanceBetweenFilter_matchesActivityWithinRange`.
- [ ] **Arrange-Act-Assert structure.** Clear sections, no mixing.
- [ ] **No logic in tests.** No conditionals, loops, or complex setup. If needed, extract to fixture/factory.
- [ ] **Edge cases covered.** Boundaries, empty inputs, nil values, error paths.
- [ ] **No redundant tests.** Removing a test should reduce confidence. If not, delete it.
- [ ] **Mocks vs fakes vs stubs.** Use the simplest that works:
  - Stub: returns canned data
  - Fake: working implementation (in-memory store)
  - Mock: verifies interactions (use sparingly)
- [ ] **No flaky tests.** Tests should be deterministic. No timing dependencies, no network calls in unit tests.

---

## Review Process

### Self-Review First

Before asking for review:
1. Run through both passes yourself
2. Check the test review items
3. Run all tests locally
4. Read the diff as if you didn't write it

### Reviewer Responsibilities

- Be specific. "This is wrong" → "This imports Combine in Domain, violating dependency rules."
- Suggest solutions. Don't just point out problems.
- Distinguish must-fix from nice-to-have.
- Approve when good enough, not when perfect.

### Author Responsibilities

- Respond to every comment (even if just "done").
- Don't take feedback personally.
- If you disagree, explain why — then defer to consensus.
- Small PRs get faster, better reviews. Keep them small.
