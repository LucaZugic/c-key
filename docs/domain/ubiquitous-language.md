# Ubiquitous Language

This glossary defines the terms used throughout c-key. These words have precise meanings that the team agrees on. Use them consistently in code, documentation, conversations, and commit messages.

## Core Terms

**Activity**
A single workout uploaded to Strava. Has properties like sport type, distance, moving time, name, and optionally associated gear. An Activity is the primary input to rule evaluation. In code, this is the `Activity` aggregate root.

**Sport**
The type of workout: Run, Ride, WeightTraining, Workout, Walk, Hike, VirtualRide, VirtualRun. Strava defines many more; we model only the subset relevant to our rules. Changing an activity's sport type is a supported action.

**Gear**
A piece of equipment registered in the user's Strava account, such as running shoes or a bike. Identified by a Strava-assigned ID (e.g., "g12345678") and a user-defined name (e.g., "Nike Pegasus 40"). Setting gear on an activity is the flagship use case.

**Rule**
A condition-action pair. A Rule has one or more Filters (the condition) and one or more Actions (what to do when the condition is met). Rules are evaluated in order against each activity.

**Filter**
A predicate that tests whether an activity matches certain criteria. Examples: sport equals Run, distance is less than 2 km, name contains "morning". All filters in a rule are AND-combined; the rule matches only if every filter passes.

**Action**
A mutation to apply to an activity. Examples: set gear to a specific ID, mute the activity, change sport type, prepend text to the name. Actions are bounded by what the Strava API supports.

**ActionPlan**
The output of rule evaluation. A list of Actions to execute on a specific Activity, along with metadata about which Rule generated each action. The ActionPlan is idempotent and safe to replay.

**Evaluation**
The process of testing all enabled Rules against an Activity and collecting the resulting Actions into an ActionPlan. Evaluation is a pure function: same inputs always produce the same outputs.

**Mute**
Set an activity's `hide_from_home` flag to true, removing it from the Strava feed. This is the only way to reduce an activity's visibility via the API; setting visibility to "private" or "only me" is not supported.

**ActivitySource**
Where the activity originated (Garmin, Coros, Apple Watch, manual upload, etc.). c-key does not rely on this because all activities are read from Strava after upload. The source is irrelevant to rule evaluation.

## Interaction Terms

**Interactive Action**
An action that requires user confirmation before execution. For example, `SetGear` with `interactive: true` presents a menu of available gear and lets the user confirm or change the selection.

**Automatic Action**
An action that executes without user interaction. For example, `Mute` is always automatic; the activity is hidden immediately.

**Smart Default**
When an interactive action presents options, the rules engine may suggest a default selection based on heuristics (e.g., the shoe most recently used for similar distances). The user can accept or change it.

## System Terms

**Shortcut**
The iOS Shortcut that orchestrates the c-key flow. It handles OAuth, fetches the rules engine bundle, calls the entry point, and executes the resulting ActionPlan against Strava.

**Rules Engine**
The TypeScript module that evaluates rules and produces ActionPlans. It has no knowledge of iOS, HTTP, or Strava API details. It is a pure function of Activity and Rules.

**Bundle**
The single JavaScript file (`c-key.js`) that contains the compiled rules engine. Hosted on GitHub Pages and fetched by the Shortcut at runtime.

**Port**
An interface that defines how the application interacts with the outside world. Examples: StravaClient, RuleStore, Logger.

**Adapter**
A concrete implementation of a port. Examples: FetchStravaClient (production), InMemoryStravaClient (tests).

## Anti-Terms

These terms are explicitly NOT part of our language:

- **Private**: We do not use "make private" because the Strava API cannot set visibility. Use "mute" instead.
- **Delete**: We do not use "delete activity" because the Strava API cannot delete. Activities can only be muted.
- **Sync**: We do not "sync" data between services. c-key reads from Strava and writes back to Strava. There is no bidirectional sync.
- **Coros**: We do not reference Coros. The project pivoted away from Coros integration after discovering the API does not expose gear data.
