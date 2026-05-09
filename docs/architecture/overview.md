# Architecture Overview

c-key splits into two distinct halves that communicate through a well-defined contract.

```
+---------------------------+       +---------------------------+
|      iOS Shortcut         |       |    TypeScript Engine      |
|   (Platform Concerns)     |       |    (Domain Logic)         |
+---------------------------+       +---------------------------+
|                           |       |                           |
|  HealthKit Trigger        |       |  Rule Evaluation          |
|  OAuth Web Flow           |       |  Filter Matching          |
|  Token Storage (Data Jar) |       |  Action Planning          |
|  Native UI (Menus, Alerts)|       |  Conflict Resolution      |
|  HTTP Requests (fetch)    |       |                           |
|                           |       |                           |
+-------------+-------------+       +-------------+-------------+
              |                                   ^
              |  1. Fetch bundle from             |
              |     GitHub Pages                  |
              +---------------------------------->|
              |                                   |
              |  2. Call evaluateAndPlan(         |
              |       activity, rules)            |
              +---------------------------------->|
              |                                   |
              |  3. Receive ActionPlan            |
              |<----------------------------------+
              |                                   |
              |  4. Execute actions via           |
              |     Strava API                    |
              +---------------------------------->  Strava
```

## Why This Split?

The Shortcut handles everything iOS-specific: triggering on workout end, storing tokens securely, presenting native UI elements, and making HTTP requests. These are capabilities that only iOS can provide.

The rules engine handles everything platform-agnostic: deciding which rules match an activity, resolving conflicts between rules, and producing a deterministic action plan. This logic has no knowledge of iOS, HTTP, or any external service.

This separation provides three benefits:

1. **Testability**: The rules engine is pure TypeScript, fully unit-testable with Vitest, no mocks of iOS APIs required.

2. **Portability**: The same engine can power a future native iOS app, a web extension, or another platform's automation tool. The domain logic never changes.

3. **Update velocity**: Pushing a new bundle to GitHub Pages updates every user's rules on their next Shortcut run. No App Store review, no re-installation.

## The Contract

The Shortcut and engine communicate through a single function:

```typescript
function evaluateAndPlan(
  activity: Activity,
  rules: Rule[]
): ActionPlan
```

The Shortcut calls this function with the current activity and the user's rules. The engine returns an `ActionPlan` containing zero or more actions to execute. The Shortcut then executes each action by making the appropriate Strava API call.

The `ActionPlan` is JSON-serializable, idempotent, and safe to replay. If the Shortcut crashes mid-execution, re-running it will not corrupt data.
