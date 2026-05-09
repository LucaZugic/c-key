# ADR-0006: Use Mute Instead of Private (Strava API Limitation)

## Status

Accepted

## Context

Users often want to hide certain activities from their Strava feed. Common cases:
- Strength training (clutters the feed, not interesting to followers)
- Very short runs (warmups, cooldowns, accidental recordings)
- Indoor trainer sessions

The ideal solution would be to set these activities to "Private" or "Only Me" visibility. However, the Strava API does not support changing activity visibility. The `visibility` field is read-only.

What the API does support is `hide_from_home`, which removes the activity from the feed while keeping it public (visible on the user's profile and to followers who view it directly).

## Decision

Use `hide_from_home: true` (mute) as the mechanism for reducing activity visibility. Do not attempt to set visibility levels.

The `Action` discriminated union includes `Mute` but does not include `MakePrivate`, `MakeFollowersOnly`, or any visibility-related actions.

Documentation and UI copy will use "mute" terminology, not "make private" or "hide," to avoid user confusion about what the action actually does.

## Consequences

**Benefits**:
- c-key can reduce feed clutter for unwanted activities
- Implementation is straightforward (single boolean field)
- No risk of implementing impossible features

**Drawbacks**:
- Muted activities are still visible on the profile and in direct links
- Users who want true privacy must manually edit in Strava
- c-key cannot fully replace Strava's UI for visibility control

**Accepted limitation**: This is a Strava platform constraint, not a c-key design choice. We document it clearly and work within the bounds.

## Date

2026-05-09
