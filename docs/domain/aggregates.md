# Aggregates

An aggregate is a cluster of domain objects that are treated as a single unit for data changes. Each aggregate has a root entity that controls access to everything inside. External objects may only hold references to the root, never to internal entities.

## Activity Aggregate

**Root Entity**: `Activity`

The Activity is the primary aggregate in c-key. It represents a single Strava workout and contains all the data needed for rule evaluation.

```typescript
interface Activity {
  readonly id: string;           // Strava activity ID
  readonly name: string;         // User-visible name
  readonly sportType: Sport;     // Run, Ride, etc.
  readonly distance: MetersDistance;
  readonly movingTime: SecondsTime;
  readonly startDate: Date;
  readonly gearId: string | null; // Currently assigned gear
}
```

**Why Activity is an aggregate root**:

1. It has a unique identity (`id`) that persists across system boundaries.
2. It is the unit of consistency for rule evaluation: a rule is evaluated against one complete Activity.
3. All rule filters operate on Activity properties.
4. All rule actions produce mutations to be applied to a single Activity.

**What the Activity aggregate does NOT contain**:

- Detailed lap or segment data. c-key operates at the activity level, not sub-activity level.
- The full list of available gear. Gear options come from the user's Strava account, not from the Activity itself.
- Historical data about the activity. We work with the current state only.

## Rule Aggregate

**Root Entity**: `Rule`

A Rule defines when and how to modify an activity. Rules are independent units that can be enabled, disabled, reordered, or deleted without affecting other rules.

```typescript
interface Rule {
  readonly id: string;
  readonly name: string;
  readonly filters: readonly Filter[];
  readonly actions: readonly Action[];
  readonly enabled: boolean;
  readonly order: number;
}
```

**Why Rule is an aggregate root**:

1. It has a unique identity (`id`).
2. It is the unit of configuration: users enable/disable individual rules.
3. A rule's filters and actions are always loaded and evaluated together.
4. Rule ordering affects conflict resolution, and order is a property of the rule itself.

**Contained value objects**:

- `Filter[]`: Conditions that must all match for the rule to fire. Filters have no identity; they are defined by their properties.
- `Action[]`: Mutations to apply when the rule fires. Actions have no identity; they are defined by their properties.

## What is NOT an aggregate root

**RuleSet / RuleCollection**

In v1, rules are managed as a flat list. There is no `RuleSet` aggregate that groups rules. Each rule stands alone. This keeps the model simple. In the future, if we add rule folders or rule groups, we might introduce a `RuleSet` aggregate.

**Gear**

Gear is a value object, not an aggregate root. It has an ID only because Strava assigns one; within c-key, we treat gear as an immutable reference. We do not create, update, or delete gear; we only read gear from the user's Strava account and reference it by ID in actions.

**ActionPlan**

The ActionPlan is a value object produced by rule evaluation. It has no persistent identity. It exists only for the duration of a single Shortcut run: the engine produces it, the Shortcut executes it, and then it's gone. There is no stored history of action plans.

## Aggregate Boundaries and Transactions

c-key does not use a database or traditional transactions. However, the aggregate boundaries still matter for consistency:

- When evaluating rules, we load the complete Activity aggregate (all properties needed for filtering).
- When building an ActionPlan, we process all Rules in order, treating the entire rule list as a single read.
- When executing an ActionPlan, each action corresponds to a single Strava API call. If one call fails, the Shortcut may retry or report the error; the atomic unit is the individual action, not the entire plan.

This is a pragmatic simplification for a client-side-only application. We accept that a partially executed plan may leave the activity in an intermediate state (e.g., gear set but name not updated). The plan is idempotent, so re-running the Shortcut will complete any missed actions.
