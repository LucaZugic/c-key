# ADR 0006: Mute, Not Private (Strava API Limitation)

## Status

Accepted

## Date

2025-01-15

## Context

Users often want to hide certain activities from their Strava feed. Gym sessions, short warm-up runs, and commutes clutter the feed. The expectation might be to "make them private."

However, Strava's API has specific limitations:

- **Visibility cannot be changed via API.** The `visibility` field in activity responses is read-only. There is no endpoint to set an activity to "Only You" (private), "Followers Only", or "Everyone".

- **Activities cannot be deleted via API.** There is no delete endpoint.

- **Map visibility cannot be changed via API.** The map privacy settings are not exposed.

These limitations are confirmed in Strava developer documentation and community forums.

## Decision

c-key uses "mute" (`hide_from_home: true`) instead of "make private" for hiding activities.

When an activity is muted:
- It is hidden from the home feed
- It is hidden from club feeds
- It is hidden from follower feeds
- It remains visible on the athlete's profile
- It remains visible via direct link
- It remains visible in activity lists

The `Action` enum includes `mute` and `unmute`. It does not include `makePrivate`, `delete`, or `editMapVisibility` because these cannot be implemented.

This is enforced at compile time — the Action type literally cannot express these impossible actions.

## Consequences

### Positive

- Users get partial hiding functionality that works
- No false promises about capabilities
- Compile-time enforcement prevents impossible actions
- Clear documentation of what "mute" actually does

### Negative

- "Mute" is less powerful than users might expect
- Activities are still visible on profile (may confuse users)
- No way to truly hide sensitive activities via automation
- Feature gap may disappoint users coming from other tools

### Neutral

- Users who want true privacy must manually edit in Strava app
- Documentation must be very clear about mute vs private
- UI should explain the limitation to prevent confusion
