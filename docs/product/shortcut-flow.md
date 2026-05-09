# Shortcut Flow

This document describes the iOS Shortcut step-by-step. It serves as the design specification for building the actual `.shortcut` file.

## Trigger

The Shortcut runs via Personal Automation triggered by HealthKit:

- **Trigger**: When a workout is logged in the Health app
- **Run**: Immediately (no confirmation prompt)

The user sets this up manually in the Shortcuts app after installing c-key.

## Flow Steps

### Step 1: Wait for Strava Upload

```
Action: Wait
Duration: 60 seconds
```

Strava takes 30-90 seconds to receive activity uploads from watches. Wait to ensure the activity is available when we query.

### Step 2: Load Credentials from Data Jar

```
Action: Get Value for Key "strava_access_token" from Data Jar
Store in: accessToken

Action: Get Value for Key "strava_token_expires_at" from Data Jar
Store in: tokenExpiresAt

Action: Get Value for Key "strava_client_id" from Data Jar
Store in: clientId

Action: Get Value for Key "strava_client_secret" from Data Jar
Store in: clientSecret

Action: Get Value for Key "strava_refresh_token" from Data Jar
Store in: refreshToken
```

### Step 3: Check If Token Expired

```
Action: If [tokenExpiresAt] < [Current Date as Unix Timestamp]
  → Go to Step 4 (Refresh Token)
Otherwise:
  → Skip to Step 5 (Fetch Activities)
```

### Step 4: Refresh Token (If Needed)

```
Action: Get Contents of URL
URL: https://www.strava.com/oauth/token
Method: POST
Headers: Content-Type: application/json
Body: {
  "client_id": [clientId],
  "client_secret": [clientSecret],
  "refresh_token": [refreshToken],
  "grant_type": "refresh_token"
}

Action: Get Dictionary Value "access_token" from [response]
Store in: accessToken

Action: Get Dictionary Value "refresh_token" from [response]
Store in: refreshToken

Action: Get Dictionary Value "expires_at" from [response]
Store in: tokenExpiresAt

Action: Set Value for Key "strava_access_token" to [accessToken] in Data Jar
Action: Set Value for Key "strava_refresh_token" to [refreshToken] in Data Jar
Action: Set Value for Key "strava_token_expires_at" to [tokenExpiresAt] in Data Jar
```

### Step 5: Fetch Recent Activities

```
Action: Get Contents of URL
URL: https://www.strava.com/api/v3/athlete/activities?per_page=5
Method: GET
Headers: Authorization: Bearer [accessToken]

Store in: activities
```

### Step 6: Find Target Activity

```
Action: Filter [activities] where [gear_id] is empty
Store in: ungearedActivities

Action: Get First Item from [ungearedActivities]
Store in: targetActivity

Action: If [targetActivity] is empty
  → Show Notification "No new activities to process"
  → Stop Shortcut
```

### Step 7: Fetch Rules Engine Bundle

```
Action: Get Contents of URL
URL: https://lucazugic.github.io/c-key/c-key.js
Method: GET

Store in: engineBundle
```

### Step 8: Prepare Engine Input

```
Action: Get Dictionary from [targetActivity]
Convert to JSON string
Store in: activityJson

Action: Get Value for Key "rules" from Data Jar
(Or use bundled default rules)
Store in: rulesJson
```

### Step 9: Run Rules Engine

```
Action: Run JavaScript on Web Page

JavaScript:
  const activity = JSON.parse(activityJson);
  const rules = JSON.parse(rulesJson);
  const result = evaluateAndPlan(activity, rules);
  completion(JSON.stringify(result));

Input: data:text/html containing [engineBundle] and the above script
Store in: actionPlanJson
```

### Step 10: Parse Action Plan

```
Action: Get Dictionary from [actionPlanJson]
Store in: actionPlan

Action: Get Dictionary Value "actions" from [actionPlan]
Store in: actions
```

### Step 11: Execute Actions

For each action in [actions]:

```
Action: If [action.type] equals "Mute"
  → PUT to Strava with { "hide_from_home": true }

Action: If [action.type] equals "ChangeSportType"
  → PUT to Strava with { "sport_type": [action.sport] }

Action: If [action.type] equals "SetGear" and [action.interactive] is false
  → PUT to Strava with { "gear_id": [action.gearId] }

Action: If [action.type] equals "SetGear" and [action.interactive] is true
  → Show Menu with gear options, default selected: [action.gearId]
  → PUT to Strava with { "gear_id": [selected gear] }
```

### Step 12: Log Result

```
Action: Set Value for Key "last_run_timestamp" to [Current Date] in Data Jar
Action: Set Value for Key "last_processed_activity_id" to [targetActivity.id] in Data Jar

Action: Show Notification
Title: "c-key"
Body: "Processed: [targetActivity.name]"
```

## Error Handling

At any step that can fail (network requests, parsing):

```
Action: If [error occurred]
  → Show Notification "c-key Error: [error message]"
  → Stop Shortcut
```

## First-Run Setup

On first run, if credentials are missing:

```
Action: If [clientId] is empty
  → Show Alert: "Welcome to c-key! You need to set up your Strava API credentials."
  → Ask for Input: "Enter your Strava Client ID"
  → Store in Data Jar
  → Ask for Input: "Enter your Strava Client Secret"
  → Store in Data Jar
  → Open URL: Strava OAuth authorization URL
  → Handle redirect, exchange code for tokens
  → Store tokens in Data Jar
```

This setup runs once. Subsequent runs use stored credentials.
