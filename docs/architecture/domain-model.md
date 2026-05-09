# Domain Model

This document defines the core types in c-key's domain. These types use the ubiquitous language defined in `docs/domain/ubiquitous-language.md`.

## Activity (Aggregate Root)

The central entity. Represents a single workout activity that may exist in Strava, Coros, or both.

```swift
struct Activity: Identifiable, Equatable {
    let id: Activity.ID
    let source: ActivitySource
    let startTime: Date
    let distance: Distance
    let movingTime: Duration
    let sport: Sport
    var gear: Gear?
    var name: String
    var isHiddenFromHome: Bool
    var isCommute: Bool
    var isTrainer: Bool

    struct ID: Hashable {
        let stravaId: Int64?
        let corosId: String?
    }
}
```

The `Activity.ID` compound key allows correlation between Strava and Coros activities.

---

## Value Objects

### Sport

```swift
enum Sport: String, CaseIterable {
    case run
    case trail_run
    case walk
    case hike
    case ride
    case mountain_bike_ride
    case virtual_ride
    case strength_training
    case workout
    case yoga
    // ... subset matching Strava's sport_type values we care about
}
```

### Gear

```swift
struct Gear: Equatable, Hashable {
    let id: Gear.ID
    let name: String
    let source: GearSource

    struct ID: Hashable {
        let value: String
    }
}

enum GearSource {
    case strava
    case coros
}
```

### Distance

```swift
struct Distance: Equatable, Hashable, Comparable {
    let meters: Double

    static func kilometers(_ km: Double) -> Distance {
        Distance(meters: km * 1000)
    }
}
```

### Duration

```swift
struct Duration: Equatable, Hashable, Comparable {
    let seconds: TimeInterval

    static func minutes(_ m: Double) -> Duration {
        Duration(seconds: m * 60)
    }
}
```

### ActivitySource

```swift
enum ActivitySource {
    case strava
    case coros
    case healthKit
}
```

---

## Rule (Entity)

A named, ordered rule with filters and actions.

```swift
struct Rule: Identifiable, Equatable {
    let id: UUID
    var name: String
    var filters: [Filter]
    var actions: [Action]
    var isEnabled: Bool
}
```

Filters are AND-combined: all must match for the rule to fire. Actions are collected across all matching rules.

---

## Filter (Sealed Type)

The `Filter` enum defines all possible filter conditions. Adding a case requires implementing its matching logic.

```swift
enum Filter: Equatable {
    case sportEquals(Sport)
    case sportIn([Sport])
    case distanceLessThan(Distance)
    case distanceGreaterThan(Distance)
    case distanceBetween(min: Distance, max: Distance)
    case movingTimeLessThan(Duration)
    case movingTimeGreaterThan(Duration)
    case movingTimeBetween(min: Duration, max: Duration)
    case nameContains(String)
    case nameMatches(regex: String)
    case gearEquals(Gear.ID)
    case hasGear
    case hasNoGear
    case timeOfDayBetween(start: TimeOfDay, end: TimeOfDay)
    case corosGearAttached
    case activitySourceEquals(ActivitySource)
}
```

---

## Action (Sealed Type)

**The Action enum is bounded by Strava API capabilities.** Every case here maps to a proven, working Strava API field.

```swift
enum Action: Equatable {
    case setGear(Gear.ID)
    case removeGear
    case mute                           // hide_from_home: true
    case unmute                         // hide_from_home: false
    case changeSportType(Sport)
    case setName(String)
    case appendToName(String)
    case prependToName(String)
    case setDescription(String)
    case appendToDescription(String)
    case setCommute(Bool)
    case setTrainer(Bool)
}
```

**Explicitly absent** (and will never be added):

- `makePrivate` — Strava API cannot set visibility
- `delete` — Strava API cannot delete activities
- `editMapVisibility` — Strava API cannot change map visibility

---

## RuleEvaluation (Domain Service)

Stateless service that evaluates rules against an activity.

```swift
struct RuleEvaluation {
    func evaluate(activity: Activity, rules: [Rule]) -> ActionPlan
}
```

---

## ActionPlan (Value Object)

The output of rule evaluation. An idempotent, ordered list of actions to apply.

```swift
struct ActionPlan: Equatable {
    let activityId: Activity.ID
    let actions: [Action]

    var isEmpty: Bool { actions.isEmpty }
}
```

The plan is deduplicated: if multiple rules set the same field, later rules override earlier ones (rule order matters). The plan can be replayed safely — applying it twice produces the same result as applying it once.

---

## Type Relationships

```
┌─────────────────────────────────────────────────────┐
│                      Rule                           │
│  id: UUID                                           │
│  name: String                                       │
│  filters: [Filter]  ────────────►  Filter (enum)    │
│  actions: [Action]  ────────────►  Action (enum)    │
└─────────────────────────────────────────────────────┘
                          │
                          │ evaluates against
                          ▼
┌─────────────────────────────────────────────────────┐
│                    Activity                         │
│  id: Activity.ID                                    │
│  sport: Sport  ─────────────────►  Sport (enum)     │
│  gear: Gear?   ─────────────────►  Gear (struct)    │
│  distance: Distance                                 │
│  movingTime: Duration                               │
└─────────────────────────────────────────────────────┘
                          │
                          │ produces
                          ▼
┌─────────────────────────────────────────────────────┐
│                   ActionPlan                        │
│  activityId: Activity.ID                            │
│  actions: [Action]                                  │
└─────────────────────────────────────────────────────┘
```
