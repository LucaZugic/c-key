# Test-Driven Development

c-key follows strict TDD. No production code is written without a failing test driving it. This document describes the workflow.

## The Loop

1. **Red**: Write a failing test that describes the desired behavior.
2. **Green**: Write the minimum code to make the test pass.
3. **Refactor**: Improve the code while keeping tests green.

Repeat for each small increment of functionality.

## Writing the Failing Test

Start with the test, not the implementation. The test name should read as a sentence describing the expected behavior.

```typescript
// tests/domain/filters.test.ts
import { describe, it, expect } from "vitest";
import { evaluateFilter } from "../../src/domain/filters";
import { meters } from "../../src/domain/values";

describe("DistanceLessThan filter", () => {
  it("returns true when activity distance is below the threshold", () => {
    const filter = { type: "DistanceLessThan" as const, meters: 2000 };
    const activity = { distance: meters(1500) };

    const result = evaluateFilter(filter, activity);

    expect(result).toBe(true);
  });
});
```

Run the test. It fails because `evaluateFilter` does not exist yet. This is the **red** state.

## Making It Green

Write the minimum code to pass the test. Do not add features the test does not require.

```typescript
// src/domain/filters.ts
import type { Filter, Activity } from "./types";

export function evaluateFilter(filter: Filter, activity: Activity): boolean {
  if (filter.type === "DistanceLessThan") {
    return activity.distance.value < filter.meters;
  }
  return false; // Other filters not yet implemented
}
```

Run the test. It passes. This is the **green** state.

## Refactoring

Now improve the code without changing behavior. Tests must stay green.

Perhaps we want to use a switch statement for clarity:

```typescript
export function evaluateFilter(filter: Filter, activity: Activity): boolean {
  switch (filter.type) {
    case "DistanceLessThan":
      return activity.distance.value < filter.meters;
    default:
      return false;
  }
}
```

Run tests again. Still green. Refactoring complete.

## Adding Edge Cases

After the happy path, add tests for edge cases:

```typescript
it("returns false when activity distance equals the threshold", () => {
  const filter = { type: "DistanceLessThan" as const, meters: 2000 };
  const activity = { distance: meters(2000) };

  const result = evaluateFilter(filter, activity);

  expect(result).toBe(false);
});

it("returns false when activity distance exceeds the threshold", () => {
  const filter = { type: "DistanceLessThan" as const, meters: 2000 };
  const activity = { distance: meters(2500) };

  const result = evaluateFilter(filter, activity);

  expect(result).toBe(false);
});
```

These tests already pass with our implementation. They are not redundant; they document expected behavior at boundary conditions.

## What Makes a Good Test

- **Descriptive name**: Reads as a sentence. "returns true when activity distance is below the threshold"
- **Single assertion**: One concept per test. If a test has five assertions, split it.
- **Isolated**: Does not depend on other tests. Can run in any order.
- **Fast**: Runs in milliseconds. No I/O, no network, no delays.
- **Deterministic**: Same input always produces same output. No randomness, no time-dependence (use a Clock port).

## Test Organization

```
tests/
  domain/
    filters.test.ts      # Filter evaluation
    actions.test.ts      # Action planning
    rules.test.ts        # Rule evaluation
  application/
    evaluate-activity.test.ts  # Use case tests
  infrastructure/
    strava-client.test.ts      # Adapter tests (with fakes)
```

Domain tests are pure unit tests. Application tests may use fake adapters. Infrastructure tests verify adapter behavior against the port interface.

## Running Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests on file change
```

All tests must pass before committing. A failing test suite blocks the commit.

## Test Coverage

Coverage is tracked but not enforced at a specific percentage. The goal is meaningful coverage:

- All happy paths covered
- Edge cases covered where they reveal behavior
- Error conditions covered

Do not write tests solely to increase coverage numbers. Write tests that would catch real bugs.
