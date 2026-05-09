# Rules Engine

The rules engine is the brain of c-key. It evaluates a set of rules against an activity and produces an action plan describing what changes to make.

## Conceptual Model

A **Rule** is a condition-action pair:

```
IF [all filters match] THEN [execute all actions]
```

**Filters** are predicates that test activity properties:
- Sport type equals Run
- Distance is less than 2 km
- Name contains "morning"
- Gear is not assigned

**Actions** are mutations to apply:
- Set gear to a specific ID
- Mute the activity (hide from feed)
- Change sport type
- Prepend text to the name

All filters in a rule are AND-combined. The rule matches only if every filter returns true.

## Rule Evaluation

When an activity is processed:

1. Load all enabled rules, sorted by `order` (ascending).
2. For each rule, test all its filters against the activity.
3. If all filters pass, the rule "fires" and its actions are collected.
4. After all rules are evaluated, collected actions are deduplicated.
5. The resulting `ActionPlan` is returned.

## Conflict Resolution

Multiple rules may target the same field. For example:
- Rule A: If distance < 5km, set gear to "Racing Flats"
- Rule B: If distance >= 5km, set gear to "Daily Trainers"

Both rules target `gear_id`. If an activity matched both (which these don't, but hypothetically), we need a resolution strategy.

**Resolution**: Later rules (higher `order` value) override earlier rules for the same target field.

This is why rules are sorted by `order` before evaluation. A user who wants Rule B to take precedence ensures Rule B has a higher `order` than Rule A.

## The v1 Rules

c-key ships with three rules built-in:

### Rule 1: Shoe by Distance (Interactive)

```
Filters:
  - SportEquals: Run
  - GearIsEmpty

Actions:
  - SetGear: { gearId: <smart default>, interactive: true }
```

When a new run uploads without gear assigned, present a menu of shoes with a smart default pre-selected based on distance. User confirms with one tap or changes the selection.

Smart default logic:
- Distance < 5 km: Racing flats or tempo shoes
- Distance 5-15 km: Daily trainers
- Distance > 15 km: Max cushion shoes

(User configures which gear ID maps to each category.)

### Rule 2: Mute Strength Training (Automatic)

```
Filters:
  - SportEquals: WeightTraining

Actions:
  - Mute
```

Strength training activities are muted automatically. No user interaction. The activity is still recorded but does not appear in the feed.

### Rule 3: Reclassify Short Runs (Automatic)

```
Filters:
  - SportEquals: Run
  - DistanceLessThan: 2000

Actions:
  - ChangeSportType: Workout
  - Mute
```

Very short "runs" (under 2 km) are often warmups, cooldowns, or accidental recordings. Reclassify them as generic workouts and mute them.

## Worked Example

Activity: A 1.5 km run, no gear assigned.

**Rule 1 (Shoe by Distance)**: Filters check SportEquals(Run) = true, GearIsEmpty = true. Rule fires. Action: SetGear (interactive).

**Rule 2 (Mute Strength)**: Filters check SportEquals(WeightTraining) = false. Rule does not fire.

**Rule 3 (Reclassify Short Runs)**: Filters check SportEquals(Run) = true, DistanceLessThan(2000) = true. Rule fires. Actions: ChangeSportType(Workout), Mute.

**Resulting ActionPlan**:
```json
{
  "activityId": "12345",
  "actions": [
    { "type": "ChangeSportType", "sport": "Workout", "sourceRuleId": "rule-3" },
    { "type": "Mute", "sourceRuleId": "rule-3" },
    { "type": "SetGear", "gearId": "g789", "interactive": true, "sourceRuleId": "rule-1" }
  ]
}
```

Note: The SetGear action is still included because the user might want to assign gear even to a muted workout. The Shortcut can choose to skip interactive actions for muted activities if desired.

## Future Considerations

- User-configurable rules (edit JSON in Data Jar, or a future rule editor UI)
- Rule import/export (share rules with other users)
- Conditional actions (if user selects X, then also do Y)
- Time-based rules (different shoes for morning vs evening runs)

For v1, the three built-in rules cover the primary use cases. Expansion comes later.
