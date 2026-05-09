# Domain Model

This document defines the core types of the c-key rules engine. These types live in `src/domain/` and are the foundation of all business logic.

## Activity (Aggregate Root)

An Activity represents a single workout uploaded to Strava. It is the primary input to rule evaluation.

```typescript
interface Activity {
  readonly id: string;
  readonly name: string;
  readonly sportType: Sport;
  readonly distance: MetersDistance;
  readonly movingTime: SecondsTime;
  readonly startDate: Date;
  readonly gearId: string | null;
}
```

The Activity is immutable from the engine's perspective. The engine reads activity data and produces a plan; it never mutates the activity directly.

## Sport (Value Object)

A discriminated string literal union representing Strava sport types we care about.

```typescript
type Sport =
  | "Run"
  | "Ride"
  | "WeightTraining"
  | "Workout"
  | "Walk"
  | "Hike"
  | "VirtualRide"
  | "VirtualRun";
```

This is a subset of Strava's full sport type list. We include only types relevant to our v1 rules. The union can be extended as new rules require new sport types.

## Gear (Value Object)

Represents a piece of equipment (shoes, bike) registered in the user's Strava account.

```typescript
interface Gear {
  readonly id: string;   // Strava gear ID, e.g., "g12345678"
  readonly name: string; // User-assigned name, e.g., "Nike Pegasus 40"
}
```

## Rule (Entity)

A Rule defines a condition-action pair: when certain filters match an activity, execute certain actions.

```typescript
interface Rule {
  readonly id: string;
  readonly name: string;
  readonly filters: readonly Filter[];  // AND-combined
  readonly actions: readonly Action[];
  readonly enabled: boolean;
  readonly order: number;  // Lower = evaluated first; used for conflict resolution
}
```

Rules are evaluated in order. All filters must match (AND logic) for the rule to fire. When a rule fires, all its actions are added to the action plan.

## Filter (Discriminated Union)

Filters are predicates tested against an activity. Each filter type has its own shape.

```typescript
type Filter =
  | { type: "SportEquals"; sport: Sport }
  | { type: "DistanceLessThan"; meters: number }
  | { type: "DistanceGreaterThan"; meters: number }
  | { type: "DistanceBetween"; minMeters: number; maxMeters: number }
  | { type: "MovingTimeLessThan"; seconds: number }
  | { type: "MovingTimeGreaterThan"; seconds: number }
  | { type: "NameMatches"; pattern: string }  // substring match
  | { type: "NameMatchesRegex"; regex: string }
  | { type: "GearEquals"; gearId: string }
  | { type: "GearIsEmpty" }
  | { type: "TimeOfDayBetween"; startHour: number; endHour: number };
```

All filters in a rule are AND-combined. A rule matches only if every filter returns true.

## Action (Discriminated Union)

Actions are mutations to apply to an activity. The set of possible actions is bounded by what the Strava API supports.

```typescript
type Action =
  | { type: "SetGear"; gearId: string; interactive: boolean }
  | { type: "Mute" }  // sets hide_from_home: true
  | { type: "ChangeSportType"; sport: Sport }
  | { type: "PrependToName"; prefix: string }
  | { type: "AppendToName"; suffix: string }
  | { type: "SetCommute"; value: boolean }
  | { type: "SetTrainer"; value: boolean };
```

**Important**: This union is exhaustive. The following actions are explicitly NOT supported because the Strava API does not allow them:

- `MakePrivate` - Strava API cannot set visibility
- `Delete` - Strava API cannot delete activities
- `EditMapVisibility` - Strava API cannot change map visibility

The `interactive` flag on `SetGear` indicates whether the user should confirm the gear selection (true) or the action should execute automatically (false).

## ActionPlan (Value Object)

The output of rule evaluation. A list of actions to execute, associated with an activity.

```typescript
interface ActionPlan {
  readonly activityId: string;
  readonly actions: readonly PlannedAction[];
}

interface PlannedAction {
  readonly action: Action;
  readonly sourceRuleId: string;
  readonly sourceRuleName: string;
}
```

The plan is idempotent: executing it twice produces the same result. Actions are deduplicated by target field. If two rules both set `gearId`, the later rule (higher `order` value) wins.

## Branded Types

To prevent primitive obsession, distances and times use branded types:

```typescript
type MetersDistance = { readonly _brand: "meters"; readonly value: number };
type SecondsTime = { readonly _brand: "seconds"; readonly value: number };

function meters(value: number): MetersDistance {
  return { _brand: "meters", value };
}

function seconds(value: number): SecondsTime {
  return { _brand: "seconds", value };
}
```

This prevents accidentally passing a distance where a time is expected, or mixing units.
