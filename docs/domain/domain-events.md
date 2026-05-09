# Domain Events

Domain events represent significant occurrences in the system. They are facts about what happened, expressed in past tense. In v0, events are in-process notifications used for UI updates and logging; they are not persisted or replayed.

## Event Catalog

### ActivityImported

Fired when a new activity is fetched from Strava or Coros and made available for rule evaluation.

```swift
struct ActivityImported: DomainEvent {
    let activityId: Activity.ID
    let source: ActivitySource
    let occurredAt: Date
}
```

**Triggers:**
- Strava API returns a new activity not previously seen
- Coros API returns a new activity not previously seen

**Consumers:**
- UI: Update activity list
- Logging: Record import for debugging

---

### RuleEvaluated

Fired after a rule has been checked against an activity, regardless of whether it matched.

```swift
struct RuleEvaluated: DomainEvent {
    let ruleId: UUID
    let ruleName: String
    let activityId: Activity.ID
    let matched: Bool
    let occurredAt: Date
}
```

**Triggers:**
- `RuleEvaluation.evaluate()` processes each rule

**Consumers:**
- Logging: Trace which rules matched
- Debug UI: Show rule match/no-match for inspection

---

### ActionExecuted

Fired when an action from an ActionPlan has been successfully applied to an activity.

```swift
struct ActionExecuted: DomainEvent {
    let activityId: Activity.ID
    let action: Action
    let occurredAt: Date
}
```

**Triggers:**
- Strava API update succeeds for an action

**Consumers:**
- UI: Show success feedback
- History: Record what was changed (non-persisted in v0)

---

### ActionFailed

Fired when an action could not be applied.

```swift
struct ActionFailed: DomainEvent {
    let activityId: Activity.ID
    let action: Action
    let reason: ActionFailureReason
    let occurredAt: Date
}

enum ActionFailureReason {
    case stravaApiError(String)
    case gearNotFound(Gear.ID)
    case rateLimited
    case networkUnavailable
}
```

**Triggers:**
- Strava API update fails
- Gear ID in action doesn't exist in Strava
- Rate limit exceeded

**Consumers:**
- UI: Show error with reason
- Retry logic: Queue for retry if transient

---

## Event Infrastructure

### In-Process Dispatch (v0)

Events are dispatched synchronously within the app process. No persistence, no replay.

```swift
protocol DomainEventPublisher {
    func publish(_ event: DomainEvent)
    func subscribe<E: DomainEvent>(_ handler: @escaping (E) -> Void)
}
```

A simple in-memory implementation:

```swift
final class InMemoryEventPublisher: DomainEventPublisher {
    private var handlers: [ObjectIdentifier: [(Any) -> Void]] = [:]

    func publish(_ event: DomainEvent) {
        let key = ObjectIdentifier(type(of: event))
        handlers[key]?.forEach { $0(event) }
    }

    func subscribe<E: DomainEvent>(_ handler: @escaping (E) -> Void) {
        let key = ObjectIdentifier(E.self)
        handlers[key, default: []].append { event in
            if let typed = event as? E { handler(typed) }
        }
    }
}
```

### Event Protocol

```swift
protocol DomainEvent {
    var occurredAt: Date { get }
}
```

All events are value types (structs). They carry all the data needed to understand what happened without requiring additional lookups.

---

## Future Considerations

### Event Sourcing (Not in v0)

Events could be persisted to rebuild state. Not needed for v0 — we're not tracking historical changes, and activities are always re-fetched from source.

### Cross-Device Sync (Not in v0)

If c-key ever syncs across devices, events would need to be persisted and replicated. Out of scope.

### Audit Log (Maybe v1)

Persisting `ActionExecuted` and `ActionFailed` events would create an audit trail. Low priority but straightforward to add later.

---

## Event Naming Conventions

- **Past tense.** Events describe what happened: `ActivityImported`, not `ImportActivity`.
- **Specific.** `ActionFailed` not `Error`.
- **Include context.** Events carry IDs and timestamps, not just flags.

---

## When to Add a New Event

Add an event when:

1. Something significant happened that other parts of the system care about
2. The UI needs to react to a state change
3. You want to trace or debug a flow

Don't add an event for:

1. Internal implementation details
2. Every method call (that's logging, not events)
3. Speculative future needs
