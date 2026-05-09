# Strava Integration

c-key reads activities from Strava and writes modifications back. This document covers the OAuth flow, available endpoints, and importantly, the API's limitations.

## OAuth 2.0 Flow

Strava uses OAuth 2.0 with authorization code grant. The Shortcut implements this flow:

1. **Authorization Request**: Open `https://www.strava.com/oauth/authorize` in a web view with parameters:
   - `client_id`: The user's registered app ID
   - `redirect_uri`: A custom URL scheme the Shortcut intercepts (e.g., `ckey://oauth`)
   - `response_type`: `code`
   - `scope`: `activity:read_all,activity:write`

2. **User Consent**: Strava shows a consent screen. User approves.

3. **Authorization Code**: Strava redirects to `ckey://oauth?code=XXXXX`. The Shortcut captures the code.

4. **Token Exchange**: POST to `https://www.strava.com/oauth/token` with:
   - `client_id`
   - `client_secret`
   - `code`: The authorization code
   - `grant_type`: `authorization_code`

5. **Receive Tokens**: Response includes `access_token`, `refresh_token`, and `expires_at`.

6. **Token Refresh**: When the access token expires, POST to the same endpoint with:
   - `client_id`
   - `client_secret`
   - `refresh_token`
   - `grant_type`: `refresh_token`

## Required Scopes

- `activity:read_all`: Read all activities, including private ones.
- `activity:write`: Update activity details.

Both scopes are required. Without `activity:write`, c-key cannot modify activities.

## Endpoints Used

### GET /api/v3/athlete/activities

Fetch the authenticated user's recent activities.

**Query Parameters**:
- `per_page`: Number of results (default 30, max 200)
- `page`: Page number for pagination

**Response**: Array of activity summaries. We use this to find the most recent activity without gear assigned.

### GET /api/v3/activities/{id}

Fetch a single activity by ID.

**Response**: Full activity details including sport type, distance, moving time, gear ID, and more.

### PUT /api/v3/activities/{id}

Update an activity's mutable fields.

**Request Body** (JSON):
```json
{
  "gear_id": "g12345678",
  "hide_from_home": true,
  "sport_type": "Workout",
  "name": "[Morning] Easy Run",
  "commute": false,
  "trainer": false
}
```

All fields are optional. Include only the fields you want to change.

## Capabilities (What the API CAN Do)

| Field | Description |
|-------|-------------|
| `gear_id` | Set the activity's gear (shoes, bike) |
| `hide_from_home` | Mute the activity (hide from feed) |
| `sport_type` | Change the activity type |
| `name` | Change the activity name |
| `description` | Set or update the description |
| `commute` | Mark as commute |
| `trainer` | Mark as trainer/indoor |

## Limitations (What the API CANNOT Do)

| Operation | Status | Notes |
|-----------|--------|-------|
| Set visibility (private/followers/public) | NOT SUPPORTED | The `visibility` field is read-only |
| Delete an activity | NOT SUPPORTED | No DELETE endpoint exists |
| Edit map visibility | NOT SUPPORTED | Cannot hide the map independently |
| Upload an activity | Supported but not used | Out of scope for c-key |
| Create segments | NOT SUPPORTED | |

**These limitations are hard constraints.** The Action union in the rules engine must not include variants for unsupported operations.

## Rate Limits

- **100 requests per 15 minutes** per access token
- **1,000 requests per day** per access token

Strategy:
- Cache activity data within a single Shortcut run.
- Use exponential backoff on 429 responses.
- The Shortcut typically makes 2-3 requests per run (list activities, get activity, update activity), well within limits.

## Per-User App Registration

Strava limits each registered app to **1 authenticated athlete** by default. To sidestep this, each c-key user registers their own Strava API application at [developers.strava.com](https://developers.strava.com).

This is documented in the user setup guide. It takes about 5 minutes and requires only a Strava account. The user pastes their client ID and secret into the Shortcut on first run.

This approach:
- Removes the athlete cap entirely (each app has one user: its creator).
- Avoids any Strava API partnership requirements.
- Keeps c-key independent and zero-cost.

## Error Handling

| HTTP Status | Meaning | Response |
|-------------|---------|----------|
| 200 | Success | Process response |
| 400 | Bad request | Log error, notify user |
| 401 | Unauthorized | Token expired; refresh and retry |
| 403 | Forbidden | Scope insufficient or activity not owned |
| 404 | Not found | Activity deleted or ID wrong |
| 429 | Rate limited | Wait and retry with backoff |
| 500+ | Server error | Retry once, then fail |

The Shortcut should handle these gracefully, showing user-friendly error messages rather than raw API responses.
