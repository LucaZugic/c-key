# c-key

c-key is an iOS app (SwiftUI, on-device only) that automates post-processing of Strava activities for a single user. It is a rules engine: when a new activity lands, user-configured rules evaluate filters and apply actions. The flagship v0 feature is propagating Coros gear assignments to Strava automatically. Hard constraints: iOS native, zero recurring infrastructure cost (no backend, no servers, no cloud functions), Coros gear sync is mandatory for v0.

---

## Reading Map

Before any change:
- Read `docs/ways-of-working/tdd.md` and `docs/ways-of-working/definition-of-done.md`

Before touching the domain core:
- Read `docs/architecture/dependency-rules.md` and `docs/domain/ubiquitous-language.md`

Before touching the Coros adapter:
- Read `docs/integrations/coros.md` in full

Before touching the Strava adapter or adding an action:
- Read `docs/integrations/strava.md` and `docs/product/rules-engine.md`

Before writing a commit message:
- Read `docs/ways-of-working/commits.md`

Before declaring a change complete:
- Re-read `docs/ways-of-working/definition-of-done.md`

Before adding a new document:
- Update the reading map in this file if the document should be read before specific kinds of changes

---

## Hard Rules (Every Action, No Exceptions)

1. **TDD**: No production code without a failing test driving it. Red, green, refactor. Always.

2. **Hexagonal**: The Domain layer imports nothing from frameworks, SDKs, networking, persistence, or UI. Only Foundation value types (`Date`, `URL`, `UUID`, `Decimal`). Verify imports before committing.

3. **Strava action set is fixed** by what the API allows. Never invent actions that cannot execute. The `Action` sealed type does not and will never contain `MakePrivate`, `Delete`, or `EditMapVisibility`.

4. **Coros adapter isolation**: The adapter must remain swappable behind its port. No Coros types may leak into the domain. If Coros auth breaks, the failure is contained to that adapter.

5. **Commits**: Small, focused, conventional-commit format (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Imperative mood. Subject ≤ 72 chars.
   - **Never attribute work to Claude, AI, Anthropic, or use `Co-authored-by:` for any AI.**
   - **No AI-generated trailer of any kind.**
   - The author is the developer.

6. **No secrets** in code, comments, tests, or fixtures. Ever.

---

## Workflow Per Change (The Loop)

State explicitly which step you are on as you work.

1. **Read** the relevant docs from the reading map.

2. **Write the smallest failing test** that captures the intent. Test name reads as a sentence (e.g., `test_distanceBetweenFilter_matchesActivityWithinRange`).

3. **Make the test green** with the smallest possible change. Hardcode if that's smaller.

4. **Code review pass 1.** Look for clean-code and hexagonal violations. List findings in your response.

5. **Code review pass 2.** With pass 1's findings in mind, look again with fresh eyes: leaked frameworks, primitive obsession, long parameter lists, vague names, feature envy, premature abstraction.

6. **Apply refactors** that improve clarity without adding speculative abstraction. Tests must stay green.

7. **Test review pass.** Add edge cases up to — but not reaching — redundancy. A test is redundant when removing it would not weaken the safety net. Remove redundant tests.

8. **Re-run all tests.** They must pass.

9. **Commit.** Small. Focused. Conventional. No Claude attribution.

This loop is non-negotiable.

---

## Out of Bounds

- Never add a backend, server, or cloud function.
- Never paste user credentials into code, comments, fixtures, or tests.
- Never call Coros's official Open API endpoints without partner credentials present in the environment.
- Never claim a Strava capability that does not exist (private, delete, map visibility).
- Never add `Co-authored-by:` trailers, AI attribution lines, or any reference to Claude/Anthropic in commit messages or PR descriptions.

---

## Project Structure

```
App/
├── Domain/           # Pure domain logic, no framework imports
├── Application/      # Use cases, orchestration
├── Infrastructure/
│   ├── Strava/       # Strava API adapter
│   ├── Coros/        # Coros Training Hub adapter
│   ├── HealthKit/    # Activity wake source
│   └── Keychain/     # Token storage
└── Composition/      # Dependency injection, app wiring
```

---

## Quick Reference

| Topic | Doc |
|-------|-----|
| Architecture overview | `docs/architecture/overview.md` |
| What each layer may import | `docs/architecture/dependency-rules.md` |
| Domain types and language | `docs/domain/ubiquitous-language.md` |
| Strava capabilities and limits | `docs/integrations/strava.md` |
| Coros fragility and approach | `docs/integrations/coros.md` |
| TDD cycle with example | `docs/ways-of-working/tdd.md` |
| Commit conventions | `docs/ways-of-working/commits.md` |
| Definition of done | `docs/ways-of-working/definition-of-done.md` |
| Rules engine model | `docs/product/rules-engine.md` |
| Roadmap and slices | `docs/product/roadmap.md` |
| ADRs | `docs/decisions/` |
