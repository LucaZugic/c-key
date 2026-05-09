# Aggregates

Aggregates are consistency boundaries. Each aggregate root is responsible for maintaining its invariants. External code accesses the aggregate only through its root.

## Activity (Aggregate Root)

`Activity` is the primary aggregate. It represents a workout that exists in one or more external systems.

### Boundaries

The Activity aggregate contains:

- The activity's identity (Strava ID, Coros ID, or both)
- Core attributes: start time, distance, moving time, sport
- Mutable attributes: name, gear, hidden status, commute flag, trainer flag

### Invariants

1. **Identity is immutable.** Once set, `Activity.ID` cannot change.
2. **Start time is immutable.** Activities don't move in time.
3. **Distance and moving time are immutable.** These come from the recording device.
4. **Sport type can change** but must be a valid `Sport` case.
5. **Gear must be valid** when set — must reference an existing `Gear.ID`.
6. **Name is never empty.** If cleared, revert to a default based on sport.

### Access Patterns

Activities are loaded from repositories (Strava, Coros). They're never constructed directly in use cases. Mutations happen through `ActionPlan` application.

```swift
// Good: Load from repository
let activity = try await stravaRepo.activity(id: 123)

// Good: Mutate through defined operations
let updatedActivity = activity.applying(plan)

// Bad: Direct construction outside tests
let activity = Activity(id: ..., source: ..., ...)  // Only in tests/factories
```

### Why Activity is an Aggregate Root

- It has a clear identity (the compound ID)
- It enforces consistency rules on its attributes
- It's the unit of work for rule evaluation and action application
- Gear and Sport are value objects inside it, not separate aggregates

---

## Rule (Aggregate Root)

`Rule` is the second aggregate. It represents a user-configured automation.

### Boundaries

The Rule aggregate contains:

- Identity (UUID)
- Name (user-facing label)
- Ordered list of filters
- Ordered list of actions
- Enabled flag

### Invariants

1. **Identity is immutable.** Rules are identified by UUID.
2. **Filters are AND-combined.** All must match for the rule to fire.
3. **Actions must be valid** — only cases from the `Action` enum.
4. **Name is never empty.** User must provide a name.
5. **At least one filter required.** A rule with no filters would match everything.
6. **At least one action required.** A rule with no actions does nothing.

### Access Patterns

Rules are loaded from `RuleStore`. They're evaluated as a set against activities. Order matters for conflict resolution.

```swift
// Load all rules
let rules = try ruleStore.loadRules()

// Evaluate against activity
let plan = evaluation.evaluate(activity: activity, rules: rules)
```

### Why Rule is an Aggregate Root

- It has identity and lifecycle independent of activities
- It enforces its own invariants (non-empty name, valid filters/actions)
- Rules are persisted and managed by users
- The filter and action lists are value objects within the aggregate

---

## What is NOT an Aggregate Root

### RuleSet

In v0, there is no `RuleSet` aggregate. Rules are managed individually, and their order is a property of the storage (array index). If rule management becomes complex (grouping, nesting, conditional enable), `RuleSet` may become an aggregate in the future.

### Gear

`Gear` is a value object, not an entity or aggregate. It's identified by its ID but has no behavior requiring aggregate boundaries. Gear is owned by external systems (Strava, Coros); we just reference it.

### GearMapping

`GearMapping` is a simple key-value association, not an aggregate. It's persisted in `GearMappingStore` but has no invariants beyond "key maps to value."

---

## Aggregate Design Principles Applied

1. **Small aggregates.** Activity and Rule are small. They don't contain deep object graphs.

2. **Reference by identity.** Activity references Gear by `Gear.ID`, not by embedding the full Gear object.

3. **Eventual consistency between aggregates.** Updating an Activity doesn't transactionally update Rules. They're independent.

4. **One aggregate per transaction.** When applying an ActionPlan, we update one Activity. If multiple activities need updates, each is a separate operation.
