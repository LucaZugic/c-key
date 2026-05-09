# c-key

c-key is an iOS Shortcut backed by a versioned TypeScript rules engine for automating Strava activity post-processing. The architecture has two halves: (1) an iOS Shortcut that handles OAuth, HealthKit triggers, token storage, and HTTP requests, and (2) a pure TypeScript rules engine bundled to a single JavaScript file hosted on GitHub Pages. The engine evaluates rules against activities and returns an action plan; the Shortcut executes it. Hard constraints: on-device only (no backend), zero recurring cost, no Coros API (proven inaccessible), runtime-agnostic engine (no iOS APIs in TypeScript).

## Reading Map

- **Before any change**: read `docs/ways-of-working/tdd.md` and `docs/ways-of-working/definition-of-done.md`.
- **Before touching the domain core**: read `docs/architecture/dependency-rules.md` and `docs/domain/ubiquitous-language.md`.
- **Before touching the Strava client adapter**: read `docs/integrations/strava.md`.
- **Before touching the Shortcut runtime adapter**: read `docs/integrations/shortcuts-runtime.md`.
- **Before adding a new rule action**: read `docs/integrations/strava.md` (capability boundaries) and `docs/product/rules-engine.md` (the rule model).
- **Before changing how the Shortcut behaves**: read `docs/product/shortcut-flow.md`.
- **Before writing a commit message**: read `docs/ways-of-working/commits.md`.
- **Before declaring a change complete**: re-read `docs/ways-of-working/definition-of-done.md`.

## Hard Rules

These apply to every action, no exceptions.

1. **TDD**: No production code without a failing test driving it. Red, green, refactor.
2. **Hexagonal**: The domain core (`src/domain/`) imports nothing from `fetch`, `console`, the Shortcut runtime, Node APIs, or any third-party SDK. Verify imports before committing.
3. **Strava action set is fixed**: Never invent actions the API cannot execute. No `MakePrivate`, no `Delete`, no `EditMapVisibility`.
4. **Runtime-agnostic engine**: No iOS-specific code in `src/`. Anything iOS-specific lives in the Shortcut, not in TypeScript.
5. **No Coros**: No Coros code, no Coros endpoints, no Coros types. Period.
6. **TypeScript strict mode**: No `any`. Use `unknown` and narrow. All strict flags enabled.
7. **Commits**: Small, focused, conventional-commit format. Never attribute work to Claude, AI, or Anthropic. No `Co-authored-by` for AI. No AI trailer of any kind. The author is the developer.
8. **No secrets**: No credentials in code, comments, tests, or fixtures. Use placeholder values in tests.

## Workflow Per Change

1. Read the relevant docs from the reading map.
2. Write the smallest failing test that captures the intent. Test name reads as a sentence.
3. Make the test green with the smallest possible change.
4. **Code review pass 1**: List clean-code and hexagonal violations.
5. **Code review pass 2**: Fresh eyes - leaked dependencies, primitive obsession, long parameter lists, vague names, premature abstraction.
6. Apply refactors that improve clarity without adding speculative abstraction. Tests stay green.
7. **Test review pass**: Add edge cases up to (but not reaching) redundancy. Remove redundant tests.
8. Re-run all tests. They must pass. Linter must pass. Type-check must pass.
9. Commit. Small. Focused. Conventional. No AI attribution.

State explicitly which step you are on as you work.

## Out of Bounds

- Never add a backend, server, or cloud function.
- Never write code that talks to Coros, Garmin, Wahoo, or any non-Strava service.
- Never paste real credentials in any committed file.
- Never claim a Strava capability that does not exist.
- Never include `Co-authored-by` trailers, AI attribution, or any reference to Claude/Anthropic in commits or PRs.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check for lint errors |
| `npm run typecheck` | Type-check without emitting |
| `npm run build` | Bundle to `dist/c-key.js` |
| `npm run format` | Format all TypeScript files |

## Project Structure

```
src/
  domain/        # Pure types and functions. No imports from outside.
  application/   # Use cases. Imports domain only.
  infrastructure/# Adapters: strava/, shortcuts-runtime/, in-memory/
  entry/         # Composition root. Shortcut entry points.
tests/
  domain/        # Unit tests for domain logic
  application/   # Tests for use cases
  infrastructure/# Integration tests for adapters
docs/            # MkDocs documentation
shortcut/        # Shortcut design spec and screenshots
```
