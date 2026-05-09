# Domain Events

Domain events represent significant occurrences within the system. In c-key, events are returned values from functions rather than published to an event bus. The Shortcut decides what to do with them (log, notify, ignore).

## Events

### ActivityImported

Raised when an activity is loaded from Strava and parsed into the domain model.

```typescript
interface ActivityImported {
  type: "ActivityImported";
  activityId: string;
  sportType: Sport;
  distance: MetersDistance;
  gearId: string | null;
  timestamp: Date;
}
```

**When raised**: At the start of rule evaluation, after fetching the activity from Strava.

**Typical response**: Log for debugging. No user-visible action.

### RuleEvaluated

Raised when a single rule is evaluated against an activity, regardless of whether it matched.

```typescript
interface RuleEvaluated {
  type: "RuleEvaluated";
  ruleId: string;
  ruleName: string;
  activityId: string;
  matched: boolean;
  filtersChecked: number;
  filtersFailed: string[]; // Names of filters that returned false
  timestamp: Date;
}
```

**When raised**: Once per rule during evaluation.

**Typical response**: Log for debugging. Useful for understanding why a rule did or did not fire.

### ActionPlanned

Raised when an action is added to the action plan.

```typescript
interface ActionPlanned {
  type: "ActionPlanned";
  activityId: string;
  action: Action;
  sourceRuleId: string;
  sourceRuleName: string;
  timestamp: Date;
}
```

**When raised**: When a matching rule's actions are collected into the plan.

**Typical response**: Log for debugging.

### ActionExecuted

Raised when an action is successfully executed via the Strava API.

```typescript
interface ActionExecuted {
  type: "ActionExecuted";
  activityId: string;
  action: Action;
  timestamp: Date;
}
```

**When raised**: After the Shortcut completes a Strava API call for the action.

**Typical response**: Log for audit trail. Optionally show a success notification.

### ActionFailed

Raised when an action fails to execute.

```typescript
interface ActionFailed {
  type: "ActionFailed";
  activityId: string;
  action: Action;
  errorMessage: string;
  httpStatus?: number;
  timestamp: Date;
}
```

**When raised**: When a Strava API call returns an error or times out.

**Typical response**: Log the error. Show a notification to the user. The Shortcut may retry or skip.

## Event Flow

A typical Shortcut run produces events in this order:

1. `ActivityImported` - Activity loaded from Strava
2. `RuleEvaluated` (N times) - Each enabled rule checked
3. `ActionPlanned` (M times) - Matching rules' actions collected
4. `ActionExecuted` or `ActionFailed` (M times) - Actions executed

## Implementation Notes

Events are not persisted. They exist only during the Shortcut run. If the Shortcut crashes, event history is lost.

Events are synchronous. The rules engine produces events as return values; it does not use async event emitters or message queues.

Events are optional. The rules engine can operate without event consumers. If no one listens, events are simply discarded.

## Future Considerations

In a future native iOS app, these events could drive:

- A live activity log visible in the UI
- Analytics (how often do rules fire, what's the most common action)
- Undo functionality (knowing what was changed makes undo possible)
- Notification customization (user configures which events trigger notifications)

For v1, events are primarily a debugging and logging tool. The Shortcut may ignore most of them, surfacing only errors and final success to the user.
