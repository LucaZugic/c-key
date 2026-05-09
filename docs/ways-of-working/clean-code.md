# Clean Code

c-key follows Clean Code principles adapted for TypeScript. This document summarizes the key practices.

## Naming

Names should reveal intent. A reader should understand what something does without reading its implementation.

```typescript
// Bad: What does 'd' mean?
const d = activity.distance.value / 1000;

// Good: The name explains the value
const distanceInKilometers = activity.distance.value / 1000;
```

```typescript
// Bad: What does this function do?
function process(a: Activity): boolean { ... }

// Good: The name describes the behavior
function activityMatchesAllFilters(activity: Activity, filters: Filter[]): boolean { ... }
```

Avoid abbreviations unless universally understood (e.g., `id`, `url`). Prefer longer descriptive names over short cryptic ones.

## Functions

### Single Responsibility

A function should do one thing and do it well. If you can describe a function with "and" in the middle, it does too much.

```typescript
// Bad: Does two things
function validateAndSave(rule: Rule): void { ... }

// Good: Separate responsibilities
function validateRule(rule: Rule): ValidationResult { ... }
function saveRule(rule: Rule): void { ... }
```

### Small Functions

Functions should be short. Aim for 20 lines or fewer. If a function is longer, extract helper functions.

```typescript
// Bad: 40-line function doing multiple things
function evaluateRules(activity: Activity, rules: Rule[]): ActionPlan {
  // 40 lines of filtering, mapping, reducing, error handling...
}

// Good: Main function orchestrates, helpers do the work
function evaluateRules(activity: Activity, rules: Rule[]): ActionPlan {
  const matchingRules = findMatchingRules(activity, rules);
  const actions = collectActions(matchingRules);
  const deduplicatedActions = deduplicateByTargetField(actions);
  return buildActionPlan(activity.id, deduplicatedActions);
}
```

### No Flag Arguments

Boolean parameters that change function behavior are confusing. What does `true` mean?

```typescript
// Bad: What does the boolean mean?
function formatDistance(meters: number, useMetric: boolean): string { ... }
formatDistance(5000, true);  // true = ?

// Good: Separate functions with clear names
function formatDistanceMetric(meters: number): string { ... }
function formatDistanceImperial(meters: number): string { ... }
```

### No Side Effects

Functions should either return a value or perform an action, not both. A function named `getX` should not modify state.

```typescript
// Bad: Getter with side effect
function getAccessToken(): string {
  if (isExpired(this.token)) {
    this.token = refreshToken(); // Side effect!
  }
  return this.token;
}

// Good: Separate concerns
function getAccessToken(): string {
  return this.token;
}

function ensureValidToken(): void {
  if (isExpired(this.token)) {
    this.token = refreshToken();
  }
}
```

## Comments

Good code is self-documenting. Comments should explain *why*, not *what*.

```typescript
// Bad: Explains what the code does (obvious from reading it)
// Loop through rules and check if they match
for (const rule of rules) {
  if (ruleMatches(rule, activity)) { ... }
}

// Good: Explains why (not obvious from the code)
// Rules are evaluated in order; later rules can override earlier ones
// for the same target field (e.g., gear_id)
for (const rule of sortedByOrder(rules)) {
  if (ruleMatches(rule, activity)) { ... }
}
```

Delete commented-out code. Version control preserves history.

## DRY (Don't Repeat Yourself)

Duplication is the root of maintenance nightmares. Extract common logic into reusable functions.

But: Do not over-abstract prematurely. The Rule of Three: Wait until you have three instances of duplication before extracting. Two instances might be coincidental.

```typescript
// Premature abstraction: Only one call site
const formatActivityName = (activity: Activity) => `${activity.sportType}: ${activity.name}`;

// Wait until you have multiple call sites that truly share the logic
```

## The Boy Scout Rule

Leave the code cleaner than you found it. If you touch a file and see a small improvement (better name, extract a function, remove dead code), make it. Small improvements accumulate.

## Error Messages

Error messages should be actionable. They should say what went wrong and what to do about it.

```typescript
// Bad: Unhelpful
throw new Error("Invalid input");

// Good: Actionable
throw new Error(
  `Activity distance must be positive, got ${distance}. ` +
  `Check that the Strava API returned valid data.`
);
```

## Formatting

Use Prettier. Do not argue about formatting. Configure it once, run `npm run format`, move on.

Consistent formatting reduces cognitive load and eliminates style debates in code review.

## TypeScript-Specific

- Prefer `interface` over `type` for object shapes (unless using unions/intersections)
- Use `readonly` for immutable properties
- Use discriminated unions for type-safe exhaustive handling
- Avoid `enum`; use string literal unions instead
- Use type imports: `import type { X } from "./x"`
