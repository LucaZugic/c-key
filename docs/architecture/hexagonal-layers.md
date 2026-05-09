# Hexagonal Layers

The TypeScript rules engine follows hexagonal architecture (ports and adapters). Each layer has strict rules about what it may import.

## src/domain/

**What lives here**: Pure types, value objects, entities, aggregate roots, and domain functions. This is the heart of the application.

**What it may import**: Only other files within `src/domain/`. Standard TypeScript/JavaScript built-ins (`Array`, `Map`, `Date`, `Math`, `JSON`) are allowed.

**What it must NOT import**: Nothing from `src/application/`, `src/infrastructure/`, `src/entry/`, or any external package. No `fetch`, no `console`, no Node APIs, no third-party SDKs.

**Example types**:
```typescript
// Value objects
type Sport = "Run" | "Ride" | "WeightTraining" | "Workout" | ...;
type MetersDistance = { readonly _brand: "meters"; readonly value: number };
type SecondsTime = { readonly _brand: "seconds"; readonly value: number };

// Entities
interface Gear { id: string; name: string; }
interface Rule { id: string; name: string; filters: Filter[]; actions: Action[]; }

// Aggregate root
interface Activity {
  id: string;
  name: string;
  sportType: Sport;
  distance: MetersDistance;
  movingTime: SecondsTime;
  startDate: Date;
  gearId: string | null;
}

// Domain functions
function evaluateRule(rule: Rule, activity: Activity): boolean;
function planActions(matchingRules: Rule[], activity: Activity): ActionPlan;
```

## src/application/

**What lives here**: Use cases that orchestrate domain logic. These are the operations the outside world can request.

**What it may import**: `src/domain/` and port interfaces defined within `src/application/` itself.

**What it must NOT import**: `src/infrastructure/`, `src/entry/`, `fetch`, `console`, or any concrete adapter implementation.

**Example types**:
```typescript
// Port interface (defined here, implemented in infrastructure)
interface StravaClient {
  getActivity(id: string): Promise<Activity>;
  updateActivity(id: string, updates: ActivityUpdates): Promise<void>;
}

// Use case
class EvaluateActivityUseCase {
  constructor(private readonly ruleStore: RuleStore) {}

  execute(activity: Activity): ActionPlan {
    const rules = this.ruleStore.getEnabledRules();
    return planActions(rules.filter(r => evaluateRule(r, activity)), activity);
  }
}
```

## src/infrastructure/

**What lives here**: Concrete implementations of ports (adapters). Each subdirectory is one adapter.

**What it may import**: `src/domain/`, `src/application/`, and runtime APIs available in the execution environment (`fetch`, `JSON`, standard ES2020 globals).

**What it must NOT import**: `src/entry/`. Infrastructure never imports the composition root.

**Subdirectories**:

- `strava/` - `FetchStravaClient` adapter using the Strava REST API via `fetch`.
- `shortcuts-runtime/` - Adapter for Shortcut-specific concerns (if any arise).
- `in-memory/` - Fake implementations for tests: `InMemoryStravaClient`, `InMemoryRuleStore`, `RecordingLogger`.

**Example adapter**:
```typescript
// src/infrastructure/strava/FetchStravaClient.ts
export class FetchStravaClient implements StravaClient {
  constructor(private readonly accessToken: string) {}

  async getActivity(id: string): Promise<Activity> {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    const data = await response.json();
    return mapToActivity(data);
  }
}
```

## src/entry/

**What lives here**: The composition root. Entry points that wire together domain, application, and infrastructure. This is where dependency injection happens.

**What it may import**: Everything. This is the only layer that sees all other layers.

**What it must NOT import**: Nothing is off-limits, but keep this layer thin. Its only job is wiring.

**Example entry point**:
```typescript
// src/entry/shortcut.ts - the single function the Shortcut calls
import { EvaluateActivityUseCase } from "../application/EvaluateActivityUseCase";
import { BundledRuleStore } from "../infrastructure/in-memory/BundledRuleStore";

export function evaluateAndPlan(activityJson: string, rulesJson: string): string {
  const activity = JSON.parse(activityJson) as Activity;
  const rules = JSON.parse(rulesJson) as Rule[];
  const ruleStore = new BundledRuleStore(rules);
  const useCase = new EvaluateActivityUseCase(ruleStore);
  const plan = useCase.execute(activity);
  return JSON.stringify(plan);
}
```

## Summary Table

| Layer | May Import | Must Not Import |
|-------|------------|-----------------|
| domain | domain only | application, infrastructure, entry, fetch, console |
| application | domain, port interfaces | infrastructure, entry, fetch, console |
| infrastructure | domain, application | entry |
| entry | everything | (no restrictions) |
| tests | everything | (no restrictions) |
