# Coros Integration

Coros is the source of gear assignments. The goal is to read which shoe was used for a run in Coros and propagate that to the matching Strava activity.

## The Hard Truth

**Coros does not have a public API for individual developers.**

The Coros Open API exists but requires partner application approval. As of January 2025, this is not available to solo developers building personal-use apps.

For v0, we use the **unofficial Training Hub API** — the same API the Coros Training Hub web app uses. This is:

- **Undocumented.** Reverse-engineered from browser network inspection.
- **Fragile.** Can break at any time without notice.
- **Possibly against ToS** at scale, but acceptable for personal, single-user use.

> Open question: Application for Coros Open API access should be submitted in parallel. If approved, we build a second adapter and swap it in.

## Spike 0: The First Code

Before any other code is written, prove that Coros auth works from Swift. This is non-negotiable. If we can't auth to Coros, the flagship feature doesn't exist.

**Spike 0 outcome:** A single passing test that proves Coros auth round-trip works.

## Authentication Flow (Training Hub)

Based on reverse-engineering and open-source implementations (`coros-connect`, `coros-api` on GitHub):

### Step 1: Get Session

```
POST https://teamcn.coros.com/account/login
Content-Type: application/json

{
  "account": "user@example.com",
  "pwd": "<md5-hashed-password>",
  "accountType": 2
}
```

Response includes a session token and user info.

### Step 2: Use Session

Include the session token in subsequent requests. The exact header format needs to be confirmed during Spike 0.

### Token Storage

- Session token stored in Keychain via `TokenStore`
- Key: `coros.session_token`
- Credentials (email/password) are entered by user and exchanged for token immediately — **never stored**

## API Surface We Need

For v0, we need exactly two capabilities:

### 1. List Activities with Gear

Fetch activities since a timestamp, including gear info.

Likely endpoint (to be confirmed):
```
GET /activity/query
```

Response includes activity list with gear assignments.

### 2. Get Single Activity Detail

Fetch a specific activity with full gear info.

Likely endpoint (to be confirmed):
```
GET /activity/detail?labelId=<activity_id>
```

## Adapter Contract

The adapter implements `CorosActivityRepository`:

```swift
protocol CorosActivityRepository {
    func activities(since: Date) async throws -> [Activity]
    func activity(id: String) async throws -> Activity
}
```

### Error Handling

The adapter must throw `CorosAdapterUnavailable` for:

- Auth failure (credentials wrong, session expired)
- API endpoint changed/removed
- Response format changed
- Network errors specific to Coros

```swift
struct CorosAdapterUnavailable: Error {
    let reason: String
}
```

This distinct error type allows the use case to:
1. Log the failure
2. Skip the gear-sync rule
3. Continue with other rules
4. Show user a warning

Do not throw generic `Error` or networking errors — the calling code needs to distinguish "Coros is broken" from "network is down."

## Containment Strategy

### Coros Types Stay Inside

- `CorosActivityDTO`, `CorosGearDTO`, `CorosSessionResponse` — all internal to `Infrastructure/Coros/`
- Map to domain `Activity` and `Gear` before returning from adapter
- No Coros-specific types escape the adapter boundary

### Single Point of Failure

When Coros breaks:
- `CorosTrainingHubClient` throws `CorosAdapterUnavailable`
- `ProcessNewActivityUseCase` catches it
- Gear-sync rule is skipped (logs warning, event emitted)
- Other rules evaluate normally
- User sees "Coros sync unavailable" in UI
- The rest of the app works

### Graceful Degradation

If Coros is unavailable:
- Activities still import from Strava
- Rules that don't depend on Coros gear still work
- Mute rules, sport-type rules, name rules — all unaffected

## Open Source References

Examine before implementing:

- `coros-connect` (Python) — Auth flow, endpoint discovery
- `coros-api` (JavaScript) — Similar, different language

These provide the baseline understanding. Port to Swift with proper error handling.

## Future: Coros Open API

If partner access is granted:

1. Build `CorosOpenApiClient` implementing same `CorosActivityRepository` port
2. Uses OAuth2 flow, documented endpoints
3. Swap in `Composition` layer
4. No domain changes required

The port abstraction makes this swap trivial.

## Spike 0 Checklist

Before writing any other feature code:

- [ ] Research: Confirm auth endpoint and request format
- [ ] Research: Confirm activity list endpoint
- [ ] Test: Write failing test for Coros auth
- [ ] Code: Implement auth in `CorosTrainingHubClient`
- [ ] Test: Test passes with real credentials (not committed)
- [ ] Document: Update this file with confirmed endpoints

The spike is complete when we can fetch one activity with its gear from Swift.
