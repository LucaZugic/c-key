# HealthKit Integration

HealthKit provides background wake capability. When a new workout is recorded, HealthKit can wake c-key in the background to process it.

## Purpose

HealthKit is **not** a data source for activities. Strava is the source of truth.

HealthKit's role is to trigger processing:
1. User completes a workout on Coros watch
2. Coros syncs to Coros app
3. Coros app writes workout to HealthKit
4. HealthKit notifies c-key of new workout
5. c-key wakes, queries Strava for recent activities, runs rules

This chain means we don't poll Strava constantly — we wake on-demand when something happens.

## Observer Query

We use `HKObserverQuery` to watch for new workouts:

```swift
let workoutType = HKObjectType.workoutType()

let query = HKObserverQuery(sampleType: workoutType, predicate: nil) { query, completionHandler, error in
    // New workout detected
    // Trigger activity processing
    completionHandler()
}

healthStore.execute(query)
```

## Background Delivery

For the observer to work when the app is not running, we need background delivery:

```swift
healthStore.enableBackgroundDelivery(for: workoutType, frequency: .immediate) { success, error in
    // Handle result
}
```

### Entitlements Required

In the app's entitlements file:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.background-delivery</key>
<true/>
```

### Info.plist

```xml
<key>NSHealthShareUsageDescription</key>
<string>c-key monitors for new workouts to automatically process your Strava activities.</string>
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
</array>
```

## Permissions

Request only what we need:

```swift
let typesToRead: Set<HKObjectType> = [HKObjectType.workoutType()]

healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
    // Handle result
}
```

We request read-only access to workouts. We never write to HealthKit.

### Permission UX

- Request at first launch, explain why
- If denied, app still works but requires manual refresh
- Show clear message: "Without HealthKit access, you'll need to manually trigger processing"

## Matching HealthKit to Strava

When HealthKit fires, we get a hint that a new workout exists. But we process Strava activities, not HealthKit workouts.

### Correlation Strategy

1. HealthKit fires: new workout detected
2. Extract start time from HealthKit workout (if available via query)
3. Query Strava for activities around that time (±60 seconds)
4. If a matching activity exists, process it
5. If no match, the Strava upload may be delayed — try again later

### Why Not Use HealthKit Data Directly?

- Strava is the source of truth for modifications
- Strava has the gear associations we need to read (for mapping)
- HealthKit workout data may differ from Strava's (different sensors, processing)
- We write to Strava API, not HealthKit

HealthKit is purely a wake trigger.

## Adapter Implementation

The adapter implements `ActivityWakeSource`:

```swift
protocol ActivityWakeSource {
    var onWake: AsyncStream<WakeEvent> { get }
    func start() async throws
    func stop()
}
```

### HealthKitWakeSource

```swift
final class HealthKitWakeSource: ActivityWakeSource {
    private let healthStore = HKHealthStore()
    private var query: HKObserverQuery?
    private var continuation: AsyncStream<WakeEvent>.Continuation?

    var onWake: AsyncStream<WakeEvent> {
        AsyncStream { continuation in
            self.continuation = continuation
        }
    }

    func start() async throws {
        // Request authorization
        // Enable background delivery
        // Start observer query
        // Yield WakeEvent to continuation when fired
    }

    func stop() {
        if let query = query {
            healthStore.stop(query)
        }
        continuation?.finish()
    }
}
```

## Limitations

### Delay

HealthKit background delivery is not instant. iOS batches notifications for battery efficiency. There may be minutes of delay between workout completion and app wake.

### Unreliability

iOS may not deliver background notifications if:
- Battery is low
- Device is in Low Power Mode
- User force-quit the app
- iOS decides to deprioritize

c-key should have a manual "Refresh" button as backup.

### No Direct Correlation

HealthKit gives us a general "new workout" signal, not a specific activity ID we can look up in Strava. We query Strava independently.

## Future: Background App Refresh

As a backup to HealthKit, we may add `BGAppRefreshTask`:

```swift
BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.ckey.refresh", using: nil) { task in
    // Periodic check for new activities
}
```

This provides a fallback if HealthKit notifications don't fire reliably.
