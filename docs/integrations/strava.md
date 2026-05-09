# Strava Integration

Strava is the primary activity platform. c-key reads activities from Strava and writes modifications back. This document defines what the Strava API can and cannot do — the source of truth for the `Action` sealed type.

## Authentication

Strava uses OAuth2 with PKCE for mobile apps.

### Scopes Required

- `activity:read_all` — Read all activities, including private ones
- `activity:write` — Update activity metadata

### Token Flow

1. User initiates auth in app
2. App opens Strava authorization URL in Safari/ASWebAuthenticationSession
3. User grants permission
4. Strava redirects to app's callback URL with authorization code
5. App exchanges code for access token and refresh token
6. Tokens stored in Keychain via `TokenStore`
7. Access token used for API calls; refresh token used when access token expires

### Token Refresh

Access tokens expire after 6 hours. Before any API call:

1. Check if `expires_at` is in the past (or within 5 minutes)
2. If expired, call token refresh endpoint
3. Store new tokens
4. Proceed with original request

## API Endpoints Used

### List Activities

```
GET /api/v3/athlete/activities
```

Parameters:
- `after` (epoch timestamp) — Only activities after this time
- `per_page` (default 30, max 200)

Returns array of activity summaries.

### Get Activity

```
GET /api/v3/activities/{id}
```

Returns full activity detail including gear.

### Update Activity

```
PUT /api/v3/activities/{id}
```

This is the core endpoint for c-key. Body fields:

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Activity title |
| `description` | string | Activity description |
| `sport_type` | string | Must be valid Strava sport type |
| `gear_id` | string | Strava gear ID, or `"none"` to remove |
| `hide_from_home` | boolean | Mute from feeds |
| `commute` | boolean | Mark as commute |
| `trainer` | boolean | Mark as indoor trainer |

## Capabilities (What We CAN Do)

These are proven, documented capabilities. The `Action` enum maps directly to these.

### Mute Activity

Set `hide_from_home: true`. The activity is hidden from:
- The athlete's home feed
- Club feeds
- Follower feeds

The activity remains visible on the athlete's profile and in activity lists.

### Change Sport Type

Set `sport_type` to any valid Strava sport type. Common values:
- `Run`, `TrailRun`, `Walk`, `Hike`
- `Ride`, `MountainBikeRide`, `VirtualRide`
- `Workout`, `WeightTraining`, `Yoga`

### Set Gear

Set `gear_id` to a Strava gear ID. The gear must:
- Belong to the authenticated athlete
- Be active (not retired)
- Match the activity type (shoes for runs, bikes for rides)

### Remove Gear

Set `gear_id` to `"none"` (literal string).

### Update Name

Set `name`. No length limit documented, but keep reasonable.

### Update Description

Set `description`. Can be empty string.

### Set Commute Flag

Set `commute: true` or `false`.

### Set Trainer Flag

Set `trainer: true` or `false`.

## Non-Capabilities (What We CANNOT Do)

These are **confirmed impossible** via the Strava API. The `Action` enum must never include cases for these.

### Cannot Set Visibility

There is no API field to set an activity to "Only You" (private), "Followers", or "Everyone". The `visibility` field in responses is read-only. This is confirmed in Strava developer forums.

> **Consequence:** c-key cannot make activities private. The "Mute" action hides from feeds but the activity remains on the profile and is still visible to anyone who can view the profile.

### Cannot Delete Activities

There is no delete endpoint for activities. An activity can only be deleted through the Strava website or app.

### Cannot Edit Map Visibility

There is no API field to hide or crop the map. Map visibility settings are controlled through the Strava website or app.

### Cannot Edit Photos

Activity photos cannot be added, removed, or reordered via API.

## Rate Limits

- **100 requests per 15 minutes** per application
- **1,000 requests per day** per application

### Strategy

1. **Cache aggressively.** Store activity data locally; don't re-fetch unnecessarily.
2. **Batch reads.** Use `per_page=200` when listing activities.
3. **Exponential backoff.** On 429, wait 2^n seconds before retry (max 5 retries).
4. **Prioritize writes.** Reads are cheaper to skip; writes are the core value.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Token expired | Refresh and retry |
| 403 | Insufficient scope | Re-auth with correct scopes |
| 404 | Activity not found | Activity was deleted; skip |
| 429 | Rate limited | Backoff and retry |
| 500+ | Server error | Retry with backoff |

## Webhook Option (Not Used in v0)

Strava offers webhooks for real-time activity notifications. Not used in v0 because:
- Requires a publicly accessible endpoint
- c-key is on-device only, no server
- HealthKit observer provides sufficient trigger

May revisit if HealthKit proves unreliable.
