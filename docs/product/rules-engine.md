# Rules Engine

The rules engine is the core of c-key. It evaluates user-defined rules against activities and produces action plans.

## Conceptual Model

```
Activity → [Rules] → ActionPlan → Strava API
```

1. A new activity arrives (detected via HealthKit)
2. The engine loads all enabled rules
3. Each rule's filters are checked against the activity
4. If all filters match, the rule's actions are collected
5. Actions from all matching rules form an ActionPlan
6. The ActionPlan is executed against Strava's API

## Rule Structure

A rule consists of:

- **Name**: User-facing label (e.g., "Sync Coros Gear")
- **Filters**: Conditions that must all be true (AND-combined)
- **Actions**: Changes to apply when filters match
- **Enabled**: Toggle to deactivate without deleting
- **Order**: Position in the rule list (affects conflict resolution)

```swift
struct Rule {
    let id: UUID
    var name: String
    var filters: [Filter]
    var actions: [Action]
    var isEnabled: Bool
}
```

## Filters

Filters are predicates. All filters in a rule must match for the rule to fire.

### Available Filters

| Filter | Description |
|--------|-------------|
| `sportEquals(Sport)` | Activity sport matches exactly |
| `sportIn([Sport])` | Activity sport is one of the list |
| `distanceLessThan(Distance)` | Shorter than threshold |
| `distanceGreaterThan(Distance)` | Longer than threshold |
| `distanceBetween(min, max)` | Within range (inclusive) |
| `movingTimeLessThan(Duration)` | Faster than threshold |
| `movingTimeGreaterThan(Duration)` | Slower than threshold |
| `nameContains(String)` | Name includes substring |
| `nameMatches(regex)` | Name matches regex pattern |
| `hasGear` | Gear is assigned |
| `hasNoGear` | No gear assigned |
| `gearEquals(Gear.ID)` | Specific gear assigned |
| `corosGearAttached` | Coros activity has gear (for sync) |
| `activitySourceEquals(Source)` | From specific source |
| `timeOfDayBetween(start, end)` | Activity started in time window |

### Filter Combination

Filters within a rule are AND-combined. For OR logic, create multiple rules.

```
Rule: "Mute strength sessions"
Filters: [sportIn([.strengthTraining, .workout, .yoga])]
Actions: [mute]
```

This rule matches activities where sport is strength training OR workout OR yoga, then mutes them.

## Actions

Actions are mutations applied to the Strava activity.

### Available Actions

| Action | Strava API Field | Notes |
|--------|------------------|-------|
| `setGear(Gear.ID)` | `gear_id` | Must be valid Strava gear ID |
| `removeGear` | `gear_id: "none"` | Clears gear |
| `mute` | `hide_from_home: true` | Hides from feeds |
| `unmute` | `hide_from_home: false` | Shows in feeds |
| `changeSportType(Sport)` | `sport_type` | Must be valid Strava sport |
| `setName(String)` | `name` | Replaces name |
| `appendToName(String)` | `name` | Adds to end |
| `prependToName(String)` | `name` | Adds to beginning |
| `setDescription(String)` | `description` | Replaces description |
| `setCommute(Bool)` | `commute` | Marks as commute |
| `setTrainer(Bool)` | `trainer` | Marks as trainer |

### Actions NOT Available

These cannot exist because Strava's API doesn't support them:

- `makePrivate` — visibility cannot be set via API
- `delete` — activities cannot be deleted via API
- `editMapVisibility` — map settings cannot be changed via API

The `Action` enum excludes these at compile time.

## Evaluation

### Process

```swift
func evaluate(activity: Activity, rules: [Rule]) -> ActionPlan {
    var actions: [Action] = []

    for rule in rules where rule.isEnabled {
        let matches = rule.filters.allSatisfy { $0.matches(activity) }
        if matches {
            actions.append(contentsOf: rule.actions)
        }
    }

    return ActionPlan(activityId: activity.id, actions: deduplicate(actions))
}
```

### Conflict Resolution

When multiple rules modify the same field, later rules win.

Rules are ordered. If Rule 1 sets `gear` to A and Rule 3 sets `gear` to B, the final action is `setGear(B)`.

Deduplication keeps only the last action for each field:

```swift
func deduplicate(_ actions: [Action]) -> [Action] {
    var seen: Set<ActionField> = []
    var result: [Action] = []

    for action in actions.reversed() {
        let field = action.affectedField
        if !seen.contains(field) {
            seen.insert(field)
            result.append(action)
        }
    }

    return result.reversed()
}
```

### Idempotency

An ActionPlan can be applied multiple times with the same result. This is important for retry scenarios.

If gear is already set to X and the action is `setGear(X)`, the API call still succeeds (no change, but no error).

## Worked Example

### Rules

1. **Sync Coros Gear**
   - Filters: `[corosGearAttached]`
   - Actions: `[setGear(mappedGearId)]`

2. **Mute Strength Sessions**
   - Filters: `[sportIn([.strengthTraining, .workout])]`
   - Actions: `[mute]`

3. **Reclassify Short Runs**
   - Filters: `[sportEquals(.run), distanceLessThan(.kilometers(2))]`
   - Actions: `[changeSportType(.workout), mute]`

### Activity: 1.5km Run with Nimbus shoe (from Coros)

1. **Sync Coros Gear**: `corosGearAttached` matches (Nimbus attached in Coros)
   - Actions: `setGear(nimbus_strava_id)`

2. **Mute Strength Sessions**: `sportIn([.strengthTraining, .workout])` does not match (.run)
   - No actions

3. **Reclassify Short Runs**: `sportEquals(.run)` matches, `distanceLessThan(.kilometers(2))` matches (1.5km < 2km)
   - Actions: `changeSportType(.workout)`, `mute`

### Resulting ActionPlan

```swift
ActionPlan(
    activityId: activity.id,
    actions: [
        .setGear(nimbus_strava_id),
        .changeSportType(.workout),
        .mute
    ]
)
```

The activity will have Nimbus gear set, be reclassified to "Workout" sport type, and be hidden from feeds.

## Gear Mapping

The `corosGearAttached` filter and `setGear` action require mapping Coros gear names to Strava gear IDs.

User configures: `"Nimbus" → "g12345678"`

When evaluating, the engine looks up the Coros gear name in the mapping store to get the Strava ID.

If no mapping exists, the gear-sync rule doesn't fire (filter doesn't match).
