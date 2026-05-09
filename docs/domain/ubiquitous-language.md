# Ubiquitous Language

This glossary defines the terms used throughout c-key. These definitions are authoritative. Use these exact words in code, tests, commits, documentation, and conversation. Consistency eliminates confusion.

---

## Core Concepts

**Activity**
: A single workout session recorded by a device or service. Has a start time, duration, distance, sport type, and optionally gear. May exist in Strava, Coros, or both.

**Sport**
: The type of workout: run, ride, walk, strength training, etc. Maps to Strava's `sport_type` field. A value object with a fixed set of cases.

**Gear**
: Equipment used for an activity, typically shoes for running. Has an ID, name, and source (Strava or Coros). Strava and Coros track gear separately; c-key bridges them.

**Gear Mapping**
: A user-defined association between a Coros gear name and a Strava gear ID. Required because the systems don't share identifiers.

---

## Rules Engine

**Rule**
: A named configuration combining filters and actions. When an activity matches all filters, the actions are collected for execution. Rules are ordered; order determines override priority.

**Filter**
: A predicate evaluated against an activity. Examples: sport equals run, distance less than 2km, Coros gear attached. Filters within a rule are AND-combined.

**Action**
: A mutation to apply to an activity. Examples: set gear, mute, change sport type. Actions are bounded by what Strava's API supports.

**Evaluation**
: The process of checking an activity against all enabled rules, collecting matching actions, and resolving conflicts.

**ActionPlan**
: The output of evaluation. A deduplicated, ordered list of actions to apply to a specific activity. Idempotent: applying it twice has the same effect as applying it once.

**Mute**
: Set `hide_from_home: true` on a Strava activity, hiding it from the home feed and club feeds. The activity remains visible on the profile. This is not the same as making it private.

---

## Sources and Sync

**ActivitySource**
: Where an activity originated: Strava, Coros, or HealthKit. Used for filtering and correlation.

**Correlation**
: Matching a Coros activity to a Strava activity based on start time and sport. Required because they have different IDs.

**Gear Sync**
: The flagship feature. When a Coros activity has gear attached, propagate that assignment to the matching Strava activity using the gear mapping.

---

## Technical Terms

**Port**
: A protocol defining how the domain interacts with an external system. Examples: `StravaActivityRepository`, `CorosActivityRepository`, `TokenStore`.

**Adapter**
: A concrete implementation of a port. Examples: `StravaApiClient` implements `StravaActivityRepository`. Adapters live in Infrastructure.

**Use Case**
: An application-layer service orchestrating domain logic and ports to accomplish a user goal. Example: `ProcessNewActivityUseCase`.

**Wake**
: A trigger indicating a new activity may be available. Typically from HealthKit's background delivery. The app wakes, queries for recent activities, and runs evaluation.

**Token**
: An authentication credential. Strava uses OAuth2 access/refresh tokens. Coros Training Hub uses session tokens. Stored securely in Keychain.

---

## What We Don't Say

Avoid these ambiguous or misleading terms:

| Avoid | Use Instead | Why |
|-------|-------------|-----|
| "Private" (for hiding) | "Mute" | Strava API cannot set visibility to private; mute hides from feeds only |
| "Delete" | (n/a) | Strava API cannot delete activities |
| "Workout" (generically) | "Activity" | "Workout" is a specific sport type in Strava |
| "Exercise" | "Activity" | Consistency |
| "Shoe" | "Gear" | Gear is the domain term; shoes are a type of gear |
| "Event" (for activity) | "Activity" | "Event" means domain event in DDD |
