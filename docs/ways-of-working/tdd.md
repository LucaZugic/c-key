# Test-Driven Development

TDD is mandatory for c-key. No production code is written without a failing test driving it. This is not bureaucracy — it's how we build correct software and maintain the courage to refactor.

## The Loop

### 1. Red: Write the Smallest Failing Test

Write a test that:
- Captures one specific behavior
- Fails for the right reason (not a typo or import error)
- Has a name that reads as a sentence

```swift
func test_distanceBetweenFilter_matchesActivityWithinRange() {
    // Arrange
    // Act
    // Assert — this fails because DistanceBetween doesn't exist yet
}
```

### 2. Green: Smallest Possible Change

Make the test pass with the minimum code. If hardcoding makes it pass, hardcode.

```swift
struct DistanceBetween {
    func matches(_ activity: Activity) -> Bool {
        return true  // Hardcoded — we'll drive out the real logic with more tests
    }
}
```

Why hardcode? It proves the test harness works. The next test will force the real implementation.

### 3. Refactor: Clean Up with Safety Net

With tests green, improve the code:
- Extract named constants
- Rename for clarity
- Remove duplication

The tests catch regressions. Refactor fearlessly.

### 4. Code Review Pass 1

Look for violations:
- Domain layer importing forbidden frameworks?
- Functions over 20 lines?
- Vague names?
- Flag arguments?

List findings explicitly before proceeding.

### 5. Code Review Pass 2 (Fresh Eyes)

Look again with pass 1's findings in mind:
- Leaked framework types?
- Primitive obsession (raw strings for IDs)?
- Feature envy?
- Premature abstraction?

### 6. Apply Refactors

Fix the issues found. Tests stay green.

### 7. Test Review

Add edge cases up to — but not reaching — redundancy.

A test is redundant when removing it would not reduce confidence. Remove redundant tests.

### 8. Run All Tests

They must pass. No exceptions.

### 9. Commit

Small. Focused. Conventional format. No AI attribution.

---

## Worked Example: DistanceBetween Filter

### Step 1: Red

```swift
final class DistanceBetweenFilterTests: XCTestCase {

    func test_distanceBetweenFilter_matchesActivityWithinRange() {
        // Arrange
        let filter = Filter.distanceBetween(
            min: .kilometers(5),
            max: .kilometers(10)
        )
        let activity = Activity.fixture(distance: .kilometers(7))

        // Act
        let result = filter.matches(activity)

        // Assert
        XCTAssertTrue(result)
    }
}
```

This fails: `Filter` has no `distanceBetween` case, no `matches` method, no `Activity.fixture`.

### Step 2: Green (Minimal)

Add the case to `Filter`:

```swift
enum Filter {
    case distanceBetween(min: Distance, max: Distance)

    func matches(_ activity: Activity) -> Bool {
        return true  // Hardcoded
    }
}
```

Add test fixture:

```swift
extension Activity {
    static func fixture(
        distance: Distance = .kilometers(5)
    ) -> Activity {
        Activity(
            id: .init(stravaId: 1, corosId: nil),
            source: .strava,
            startTime: Date(),
            distance: distance,
            movingTime: .minutes(30),
            sport: .run,
            gear: nil,
            name: "Test Run",
            isHiddenFromHome: false,
            isCommute: false,
            isTrainer: false
        )
    }
}
```

Test passes. But it's hardcoded.

### Step 3: Add Failing Test for Edge Case

```swift
func test_distanceBetweenFilter_rejectsActivityBelowRange() {
    let filter = Filter.distanceBetween(
        min: .kilometers(5),
        max: .kilometers(10)
    )
    let activity = Activity.fixture(distance: .kilometers(3))

    let result = filter.matches(activity)

    XCTAssertFalse(result)  // Fails! Hardcoded true
}
```

### Step 4: Green (Real Implementation)

```swift
func matches(_ activity: Activity) -> Bool {
    switch self {
    case .distanceBetween(let min, let max):
        return activity.distance >= min && activity.distance <= max
    }
}
```

Both tests pass.

### Step 5: Refactor

The code is simple enough. No refactoring needed yet.

### Step 6: Add More Tests

```swift
func test_distanceBetweenFilter_rejectsActivityAboveRange() {
    let filter = Filter.distanceBetween(
        min: .kilometers(5),
        max: .kilometers(10)
    )
    let activity = Activity.fixture(distance: .kilometers(15))

    XCTAssertFalse(filter.matches(activity))
}

func test_distanceBetweenFilter_matchesActivityAtMinBoundary() {
    let filter = Filter.distanceBetween(
        min: .kilometers(5),
        max: .kilometers(10)
    )
    let activity = Activity.fixture(distance: .kilometers(5))

    XCTAssertTrue(filter.matches(activity))
}

func test_distanceBetweenFilter_matchesActivityAtMaxBoundary() {
    let filter = Filter.distanceBetween(
        min: .kilometers(5),
        max: .kilometers(10)
    )
    let activity = Activity.fixture(distance: .kilometers(10))

    XCTAssertTrue(filter.matches(activity))
}
```

Boundaries are tested. All pass.

### Step 7: Test Review

Are these tests redundant? No — each tests a distinct boundary condition. We could parameterize:

```swift
func test_distanceBetweenFilter_matchingBehavior() {
    let filter = Filter.distanceBetween(
        min: .kilometers(5),
        max: .kilometers(10)
    )

    let cases: [(Distance, Bool)] = [
        (.kilometers(3), false),   // below
        (.kilometers(5), true),    // at min
        (.kilometers(7), true),    // within
        (.kilometers(10), true),   // at max
        (.kilometers(15), false),  // above
    ]

    for (distance, expected) in cases {
        let activity = Activity.fixture(distance: distance)
        XCTAssertEqual(
            filter.matches(activity),
            expected,
            "Distance \(distance) should \(expected ? "match" : "not match")"
        )
    }
}
```

One parameterized test replaces five. Cleaner, same coverage.

### Step 8: Commit

```
feat: add DistanceBetween filter with boundary matching
```

---

## Test Naming Convention

Test names read as sentences:

```
test_[unit]_[behavior]_[condition]
```

Examples:
- `test_distanceBetweenFilter_matchesActivityWithinRange`
- `test_ruleEvaluation_collectsActionsFromAllMatchingRules`
- `test_stravaClient_refreshesTokenWhenExpired`

Avoid:
- `testDistanceBetween` — what about it?
- `test1`, `test2` — meaningless
- `testItWorks` — what's "it"?
