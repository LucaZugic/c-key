# Code Review Checklist

Use this checklist for every code change. Review in two passes: first for architecture and design, second for implementation details.

## Pass 1: Architecture and Design

### Hexagonal Compliance

- [ ] Domain code imports nothing from application, infrastructure, or entry layers
- [ ] Domain code uses no `fetch`, `console`, or Node APIs
- [ ] Application code depends on port interfaces, not concrete adapters
- [ ] Infrastructure code does not import from entry layer

### Domain Purity

- [ ] Domain types are immutable (use `readonly` modifiers)
- [ ] Domain functions are pure (same input = same output, no side effects)
- [ ] No I/O in domain layer (no HTTP, no logging, no file access)

### Strava Capability Boundaries

- [ ] Actions in the Action union are limited to what Strava API supports
- [ ] No MakePrivate, Delete, or EditMapVisibility actions
- [ ] New actions are documented with corresponding Strava API capability

## Pass 2: Implementation Details

### Clean Code

- [ ] Functions are 20 lines or fewer
- [ ] Functions have a single responsibility
- [ ] Names reveal intent without needing comments
- [ ] No flag arguments (boolean parameters that change behavior)
- [ ] No magic numbers (use named constants)
- [ ] No commented-out code

### TypeScript Quality

- [ ] No `any` type (use `unknown` and narrow)
- [ ] No `as` type assertions (except in tests for test data)
- [ ] No non-null assertions (`!`) in production code
- [ ] Discriminated unions are exhaustively switched
- [ ] Optional properties are handled explicitly

### Primitive Obsession

- [ ] Distances use `MetersDistance` branded type, not raw numbers
- [ ] Times use `SecondsTime` branded type, not raw numbers
- [ ] IDs are typed (e.g., `ActivityId`, `GearId`) where ambiguity is possible

### Error Handling

- [ ] Errors are typed, not `unknown` thrown bare
- [ ] Error messages are actionable (say what went wrong and what to do)
- [ ] Async code has proper error handling (no unhandled promise rejections)

## Pass 3: Tests

### Test Quality

- [ ] Test names read as sentences describing behavior
- [ ] Each test has a single assertion (or tightly related assertions)
- [ ] Tests are independent (can run in any order)
- [ ] Tests use fakes/stubs, not mocks (unless testing interaction)

### Test Coverage

- [ ] Happy path is covered
- [ ] Edge cases are covered (boundaries, empty inputs, nulls)
- [ ] Error conditions are covered
- [ ] No redundant tests (each test adds unique value)

### Test Organization

- [ ] Tests are in the correct directory (domain/, application/, infrastructure/)
- [ ] Test file matches source file naming convention

## Final Checks

- [ ] All tests pass: `npm test`
- [ ] Linter passes: `npm run lint`
- [ ] Type check passes: `npm run typecheck`
- [ ] Formatter applied: `npm run format`
- [ ] No TODOs without issue links
- [ ] Documentation updated if behavior changed
- [ ] Commit message follows conventions
- [ ] No AI attribution in commit

## Common Issues to Watch For

| Issue | Fix |
|-------|-----|
| Domain imports `fetch` | Move HTTP to infrastructure adapter |
| Function over 20 lines | Extract helper functions |
| Boolean parameter | Replace with two functions or a strategy object |
| Bare `any` | Use `unknown` and type guards |
| Unhandled Promise | Add `.catch()` or wrap in try/catch |
| Magic number | Define a named constant |
| Test named "should work" | Rename to describe specific behavior |
| Multiple unrelated assertions | Split into multiple tests |
