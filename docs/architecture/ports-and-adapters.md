# Ports and Adapters

Ports are interfaces that define how the application communicates with the outside world. Adapters are concrete implementations of those interfaces. This separation allows the domain to remain pure and testable.

## StravaClient Port

Defines operations for reading and writing Strava activities.

```typescript
interface StravaClient {
  getActivity(id: string): Promise<Activity>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  updateActivity(id: string, updates: ActivityUpdates): Promise<void>;
}

interface ActivityUpdates {
  gearId?: string;
  hideFromHome?: boolean;
  sportType?: Sport;
  name?: string;
  commute?: boolean;
  trainer?: boolean;
}
```

### FetchStravaClient (Production Adapter)

Located in `src/infrastructure/strava/FetchStravaClient.ts`. Uses the standard `fetch` API to communicate with Strava's REST API.

- Requires an access token passed at construction time.
- Handles JSON serialization/deserialization.
- Maps Strava's snake_case response to our camelCase domain types.
- Does not handle token refresh (that is the Shortcut's responsibility).

### InMemoryStravaClient (Test Adapter)

Located in `src/infrastructure/in-memory/InMemoryStravaClient.ts`. A fake implementation for unit tests.

- Stores activities in a simple Map.
- Allows tests to pre-populate activities and verify updates.
- No network calls, fully synchronous behavior (returns immediately resolved promises).

## RuleStore Port

Defines how rules are loaded.

```typescript
interface RuleStore {
  getEnabledRules(): Rule[];
  getAllRules(): Rule[];
}
```

### BundledRuleStore (Production Adapter)

Located in `src/infrastructure/in-memory/BundledRuleStore.ts`. For v1, rules are baked into the bundle at build time or passed in by the Shortcut.

- Accepts a `Rule[]` at construction time.
- Returns the same rules on every call.
- No persistence, no remote fetching.

In v2, this might be replaced by a `DataJarRuleStore` that reads user-configured rules from Data Jar storage.

### InMemoryRuleStore (Test Adapter)

Located in `src/infrastructure/in-memory/InMemoryRuleStore.ts`. Allows tests to configure rules dynamically.

- Rules can be added, removed, or modified between test assertions.
- Useful for testing rule ordering and conflict resolution.

## Logger Port

Defines a minimal logging interface for observability.

```typescript
interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}
```

### ConsoleLogger (Production Adapter)

Located in `src/infrastructure/shortcuts-runtime/ConsoleLogger.ts`. Writes to `console.log`, `console.warn`, and `console.error`.

Note: In the Shortcuts runtime, console output may not be visible. This logger is primarily useful during local development and testing.

### RecordingLogger (Test Adapter)

Located in `src/infrastructure/in-memory/RecordingLogger.ts`. Captures all log calls for test assertions.

```typescript
class RecordingLogger implements Logger {
  readonly messages: Array<{ level: string; message: string; context?: Record<string, unknown> }> = [];

  info(message: string, context?: Record<string, unknown>): void {
    this.messages.push({ level: "info", message, context });
  }
  // ... warn, error similarly
}
```

## Clock Port

Abstracts the current time for testability.

```typescript
interface Clock {
  now(): Date;
}
```

### SystemClock (Production Adapter)

Returns the actual current time via `new Date()`.

### FixedClock (Test Adapter)

Returns a fixed time configured at construction. Essential for testing time-of-day filters.

```typescript
class FixedClock implements Clock {
  constructor(private readonly fixedTime: Date) {}
  now(): Date { return this.fixedTime; }
}
```

## Adapter Location Summary

| Port | Production Adapter | Test Adapter |
|------|-------------------|--------------|
| StravaClient | `infrastructure/strava/FetchStravaClient.ts` | `infrastructure/in-memory/InMemoryStravaClient.ts` |
| RuleStore | `infrastructure/in-memory/BundledRuleStore.ts` | `infrastructure/in-memory/InMemoryRuleStore.ts` |
| Logger | `infrastructure/shortcuts-runtime/ConsoleLogger.ts` | `infrastructure/in-memory/RecordingLogger.ts` |
| Clock | `infrastructure/shortcuts-runtime/SystemClock.ts` | `infrastructure/in-memory/FixedClock.ts` |
