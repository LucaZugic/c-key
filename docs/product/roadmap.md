# Roadmap

Development proceeds in slices. Each slice ends with something working and demoable. No multi-week sprints ending in "almost done."

## Spike 0: Prove Coros Auth

**Goal**: Demonstrate that Coros Training Hub authentication works from Swift.

**Outcome**: A single passing test that authenticates to Coros and fetches one activity with its gear assignment.

**Why first**: If Coros auth doesn't work, the flagship feature (gear sync) doesn't exist. We need to prove this before writing any other code.

**Deliverables**:
- `CorosTrainingHubClient` with auth implementation
- Test that proves round-trip
- Documentation of confirmed API endpoints in `docs/integrations/coros.md`

**Not included**:
- Full error handling
- Token refresh
- Production-ready code

This is a spike — exploratory code to prove a concept. It will be refactored later.

---

## Slice 1: Hardcoded Gear Sync, Manual Trigger

**Goal**: Sync one Coros gear assignment to one Strava activity via a button press.

**User story**: As a user, I can tap a button, and my most recent Strava activity gets the gear from my most recent Coros activity.

**Deliverables**:
- Strava OAuth flow (basic, working)
- `StravaApiClient` with activity read/update
- Hardcoded gear mapping (one shoe)
- Single-screen SwiftUI UI with one button
- Manual trigger (no background)

**Constraints**:
- One hardcoded mapping, not configurable
- Most recent activity only, not historical
- No rules engine yet — direct action

**Definition of done**: Tap button → gear appears on Strava activity.

---

## Slice 2: HealthKit-Driven Background Trigger

**Goal**: Replace manual button with automatic trigger when a new workout appears.

**User story**: As a user, when I complete a run on my Coros watch, the gear automatically syncs to Strava without me opening the app.

**Deliverables**:
- HealthKit observer query for workouts
- Background delivery entitlement
- Activity matching (HealthKit wake → Strava query)
- Notification or log when sync completes

**Constraints**:
- Still hardcoded gear mapping
- Still only gear sync, no other rules

**Definition of done**: Complete run on watch → gear on Strava within minutes, no app interaction.

---

## Slice 3: Generalized Rules Engine

**Goal**: Gear sync becomes one rule among many. The engine evaluates all rules.

**User story**: As a user, I can configure multiple rules (mute strength, reclassify short runs) and they all apply automatically.

**Deliverables**:
- Domain model: `Rule`, `Filter`, `Action`, `ActionPlan`
- `RuleEvaluation` service
- `RuleStore` for persistence
- Migrate hardcoded gear sync to a rule
- Add sample rules: mute strength, reclassify short runs

**Constraints**:
- Rules are code-configured or JSON, not UI-editable yet
- No conflict resolution UI (last rule wins silently)

**Definition of done**: Multiple rules evaluate and apply on each activity.

---

## Slice 4: Rule Editor UI

**Goal**: Users can create, edit, delete, and reorder rules in the app.

**User story**: As a user, I can tap to create a new rule, select filters and actions from pickers, and save it.

**Deliverables**:
- Rules list screen
- Rule detail/edit screen
- Filter picker (all filter types)
- Action picker (all action types)
- Gear mapping configuration screen
- Reorder rules (drag or up/down)

**Constraints**:
- Basic UI, not polished
- No undo (delete is permanent)

**Definition of done**: Full CRUD for rules via UI.

---

## Future (Not Scheduled)

These are ideas, not commitments. They may never be built.

### Multi-Device Sync

Sync rules across devices via iCloud or similar. Requires persistence redesign.

### Rule Sharing

Export/import rules as JSON. Share "Mute gym sessions" rule with others.

### Coros Open API

If partner access is granted, build `CorosOpenApiClient` and swap it in. No architecture changes, just a new adapter.

### Historical Backfill

Apply rules to past activities. Requires careful rate limit handling.

### Strava Webhooks

If we ever have a server, use webhooks instead of HealthKit polling. Out of scope for on-device-only v0.

---

## Principles

### Slices, Not Sprints

Each slice delivers working software. No "we'll integrate it all at the end."

### Prove Risk Early

Spike 0 proves the riskiest part (Coros auth) before investing in the rest.

### Minimal Viable First

Slice 1 is the smallest thing that demonstrates value. Then iterate.

### TDD Throughout

Every slice is built test-first. The roadmap doesn't change the process.
