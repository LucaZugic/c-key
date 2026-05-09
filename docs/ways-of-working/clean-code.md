# Clean Code

Clean code principles applied to Swift development in c-key. Based on Uncle Bob's teachings, adapted for our context.

## Naming

### Intention-Revealing Names

The name should tell you why it exists, what it does, and how it's used.

```swift
// Bad
let d: Int  // elapsed time in days

// Good
let elapsedTimeInDays: Int
```

```swift
// Bad
func process(_ a: Activity)

// Good
func evaluateRules(against activity: Activity)
```

### Avoid Disinformation

Don't use names that mean something else in the domain or language.

```swift
// Bad — "list" implies Swift's List or a specific data structure
let activityList: [Activity]

// Good
let activities: [Activity]
```

### Make Meaningful Distinctions

If names must be different, make the difference meaningful.

```swift
// Bad — what's the difference?
func getActivity() -> Activity
func getActivityData() -> Activity
func getActivityInfo() -> Activity

// Good
func fetchActivity(id: Activity.ID) -> Activity
func activity(matching filter: Filter) -> Activity?
```

### Pronounceable Names

If you can't say it, you can't discuss it.

```swift
// Bad
let genymdhms: Date  // generation year/month/day/hour/minute/second

// Good
let generationTimestamp: Date
```

---

## Functions

### Small

Functions should be small. Then smaller.

**Target: under 10 lines.** Hard limit: 20 lines.

If a function is longer, extract parts into well-named helper functions.

### Do One Thing

A function should do one thing, do it well, and do it only.

```swift
// Bad — does three things
func processActivity(_ activity: Activity) {
    validateActivity(activity)
    applyRules(to: activity)
    saveActivity(activity)
}

// Good — orchestrates three single-purpose functions
func processActivity(_ activity: Activity) {
    let validated = validate(activity)
    let modified = applyRules(to: validated)
    save(modified)
}
```

### One Level of Abstraction

All statements in a function should be at the same level of abstraction.

```swift
// Bad — mixed levels
func processActivity(_ activity: Activity) {
    let rules = ruleStore.loadRules()  // high level
    var actions: [Action] = []
    for rule in rules {  // drops to iteration detail
        if rule.filters.allSatisfy({ $0.matches(activity) }) {
            actions.append(contentsOf: rule.actions)
        }
    }
    // ...
}

// Good — consistent level
func processActivity(_ activity: Activity) {
    let rules = loadRules()
    let plan = evaluate(rules: rules, against: activity)
    execute(plan)
}
```

### No Flag Arguments

A function that takes a boolean to decide behavior is doing two things.

```swift
// Bad
func renderActivity(_ activity: Activity, detailed: Bool)

// Good
func renderActivitySummary(_ activity: Activity)
func renderActivityDetail(_ activity: Activity)
```

### Few Arguments

Ideal: zero. Acceptable: one or two. Three: needs justification. More: refactor.

```swift
// Bad
func createActivity(
    name: String,
    distance: Double,
    duration: TimeInterval,
    sport: String,
    gearId: String?
) -> Activity

// Good
func createActivity(from dto: ActivityDTO) -> Activity

// Or better, make Activity's init clear
let activity = Activity(
    name: dto.name,
    distance: Distance(meters: dto.distance),
    duration: Duration(seconds: dto.duration),
    sport: Sport(rawValue: dto.sport)!,
    gear: dto.gearId.map { Gear.ID(value: $0) }
)
```

---

## Comments

### Explain Why, Not What

The code shows what. Comments explain why — the intent, the trade-off, the constraint.

```swift
// Bad — repeats the code
// Increment counter by one
counter += 1

// Good — explains why
// Strava rate limits reset every 15 minutes; we track calls to stay under
requestCount += 1
```

### Don't Comment Bad Code — Rewrite It

If code needs a comment to be understood, the code is the problem.

```swift
// Bad
// Check if activity is a short run that should be reclassified
if activity.sport == .run && activity.distance.meters < 2000 {
    // ...
}

// Good
if activity.isShortRun {
    // ...
}

extension Activity {
    var isShortRun: Bool {
        sport == .run && distance < .kilometers(2)
    }
}
```

### Acceptable Comments

- Legal comments (copyright, license)
- Explanation of intent
- Warning of consequences
- TODO with issue link
- Public API documentation

---

## DRY (Don't Repeat Yourself)

Duplication is the root of all evil in software.

```swift
// Bad — logic repeated
func validateStravaActivity(_ activity: Activity) {
    guard activity.distance.meters > 0 else { throw ValidationError.invalidDistance }
    guard !activity.name.isEmpty else { throw ValidationError.emptyName }
}

func validateCorosActivity(_ activity: Activity) {
    guard activity.distance.meters > 0 else { throw ValidationError.invalidDistance }
    guard !activity.name.isEmpty else { throw ValidationError.emptyName }
}

// Good
func validate(_ activity: Activity) throws {
    guard activity.distance.meters > 0 else { throw ValidationError.invalidDistance }
    guard !activity.name.isEmpty else { throw ValidationError.emptyName }
}
```

But don't over-abstract. Three similar lines are better than a premature abstraction.

---

## The Boy Scout Rule

Leave the code cleaner than you found it.

Every time you touch a file:
- Fix a small naming issue
- Extract a too-long function
- Remove dead code
- Add a missing test

Small, continuous improvement compounds.

---

## Error Handling

### Use Exceptions for Exceptional Things

Don't use errors for control flow.

```swift
// Bad
func findGear(id: Gear.ID) throws -> Gear {
    guard let gear = gearStore[id] else {
        throw GearError.notFound
    }
    return gear
}

// Then catching to handle "not found" as normal flow
do {
    let gear = try findGear(id: id)
} catch {
    // not found is expected, use default
}

// Good
func findGear(id: Gear.ID) -> Gear? {
    gearStore[id]
}

// Caller handles nil as normal case
let gear = findGear(id: id) ?? defaultGear
```

### Provide Context with Errors

Errors should tell you what went wrong and where.

```swift
// Bad
throw Error.failed

// Good
throw StravaAPIError.updateFailed(
    activityId: activity.id,
    field: "gear_id",
    reason: "Gear not found in athlete's gear list"
)
```
