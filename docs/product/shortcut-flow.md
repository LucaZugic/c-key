# Shortcut Flow

This document describes the iOS Shortcut step-by-step. It serves as the design specification for building the actual `.shortcut` file.

**No third-party apps required.** All storage uses native iCloud Drive files.

## Storage

| Data | Location | Format |
|------|----------|--------|
| Tokens & credentials | `iCloud Drive/Shortcuts/c-key/config.json` | JSON |
| Rules | Baked into Shortcut | JSON Text block |

### config.json structure

```json
{
  "client_id": "12345",
  "client_secret": "abc123...",
  "access_token": "xyz789...",
  "refresh_token": "def456...",
  "expires_at": 1704067200
}
```

### Rules (baked into Shortcut)

```json
[
  {
    "id": "shoe-rule",
    "name": "Assign Shoes",
    "filters": [
      { "type": "SportEquals", "sport": "Run" },
      { "type": "GearIsEmpty" }
    ],
    "actions": [{ "type": "SetGear", "gearId": "YOUR_SHOE_ID", "interactive": true }],
    "enabled": true,
    "order": 1
  },
  {
    "id": "mute-strength",
    "name": "Mute Strength Training",
    "filters": [{ "type": "SportEquals", "sport": "WeightTraining" }],
    "actions": [{ "type": "Mute" }],
    "enabled": true,
    "order": 2
  },
  {
    "id": "short-run",
    "name": "Reclassify Short Runs",
    "filters": [
      { "type": "SportEquals", "sport": "Run" },
      { "type": "DistanceLessThan", "meters": 1000 }
    ],
    "actions": [{ "type": "ChangeSportType", "sport": "Walk" }],
    "enabled": true,
    "order": 3
  }
]
```

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

### Step 2: Load Config from iCloud

```
Action: Get File
Path: Shortcuts/c-key/config.json
Service: iCloud Drive

Action: Get Dictionary from [file contents]
Store in: config

Action: Get Dictionary Value "client_id" from [config]
Store in: clientId

Action: Get Dictionary Value "client_secret" from [config]
Store in: clientSecret

Action: Get Dictionary Value "access_token" from [config]
Store in: accessToken

Action: Get Dictionary Value "refresh_token" from [config]
Store in: refreshToken

Action: Get Dictionary Value "expires_at" from [config]
Store in: tokenExpiresAt
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
Headers: Content-Type: application/x-www-form-urlencoded
Body: client_id=[clientId]&client_secret=[clientSecret]&refresh_token=[refreshToken]&grant_type=refresh_token

Action: Get Dictionary Value "access_token" from [response]
Store in: accessToken

Action: Get Dictionary Value "refresh_token" from [response]
Store in: refreshToken

Action: Get Dictionary Value "expires_at" from [response]
Store in: tokenExpiresAt

Action: Set Dictionary Value "access_token" to [accessToken] in [config]
Action: Set Dictionary Value "refresh_token" to [refreshToken] in [config]
Action: Set Dictionary Value "expires_at" to [tokenExpiresAt] in [config]

Action: Save File
Input: [config as JSON text]
Path: Shortcuts/c-key/config.json
Service: iCloud Drive
Overwrite: true
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

Action: Text (containing baked-in rules JSON)
Store in: rulesJson
```

### Step 9: Run Rules Engine

```
Action: Run JavaScript on Web Page

JavaScript:
  const activity = activityJson;
  const rules = rulesJson;
  const result = CKey.evaluateAndPlan(activity, rules);
  completion(result);

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
Action: Get Dictionary Value "action" from [item]
Store in: actionDetails

Action: Get Dictionary Value "type" from [actionDetails]
Store in: actionType

Action: If [actionType] equals "Mute"
  → PUT https://www.strava.com/api/v3/activities/[targetActivity.id]
    Headers: Authorization: Bearer [accessToken]
    Body: { "hide_from_home": true }

Action: If [actionType] equals "ChangeSportType"
  → Get Dictionary Value "sport" from [actionDetails]
  → PUT https://www.strava.com/api/v3/activities/[targetActivity.id]
    Headers: Authorization: Bearer [accessToken]
    Body: { "sport_type": [sport] }

Action: If [actionType] equals "SetGear"
  → Get Dictionary Value "gearId" from [actionDetails]
  → Get Dictionary Value "interactive" from [actionDetails]
  → If [interactive] is true
    → Show Menu with gear options, default selected: [gearId]
    → Store selection in: selectedGearId
  → Otherwise
    → Set selectedGearId to [gearId]
  → PUT https://www.strava.com/api/v3/activities/[targetActivity.id]
    Headers: Authorization: Bearer [accessToken]
    Body: { "gear_id": [selectedGearId] }
```

### Step 12: Log Result

```
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

On first run, if config file doesn't exist:

```
Action: Get File (Shortcuts/c-key/config.json)
  → If file not found:

Action: Show Alert
Title: "Welcome to c-key!"
Message: "You need to set up your Strava API credentials."

Action: Ask for Input
Prompt: "Enter your Strava Client ID"
Store in: clientId

Action: Ask for Input
Prompt: "Enter your Strava Client Secret"
Store in: clientSecret

Action: Open URL
URL: https://www.strava.com/oauth/authorize?client_id=[clientId]&response_type=code&redirect_uri=http://localhost&scope=activity:read_all,activity:write

Action: Show Alert
Message: "After authorizing, copy the 'code' parameter from the redirect URL"

Action: Ask for Input
Prompt: "Paste the authorization code"
Store in: authCode

Action: Get Contents of URL
URL: https://www.strava.com/oauth/token
Method: POST
Body: client_id=[clientId]&client_secret=[clientSecret]&code=[authCode]&grant_type=authorization_code

Action: Create config dictionary with all values

Action: Save File
Input: [config as JSON]
Path: Shortcuts/c-key/config.json
Service: iCloud Drive
```

This setup runs once. Subsequent runs use stored credentials.
