# Shortcut Flow Specification

This document specifies the iOS Shortcut implementation. It maps each logical step to specific Shortcut actions.

## Trigger Configuration

**Automation Type**: Personal Automation
**Trigger**: Health > Workout > Any Workout > Is Logged
**Run**: Immediately (disable "Ask Before Running")

## Variables Used

| Variable | Type | Source |
|----------|------|--------|
| `clientId` | Text | Data Jar |
| `clientSecret` | Text | Data Jar |
| `accessToken` | Text | Data Jar |
| `refreshToken` | Text | Data Jar |
| `tokenExpiresAt` | Number | Data Jar |
| `activities` | Dictionary | Strava API |
| `targetActivity` | Dictionary | Filtered from activities |
| `engineBundle` | Text | GitHub Pages |
| `actionPlan` | Dictionary | Rules engine output |

## Step-by-Step Actions

### 1. Wait for Strava Upload

```
Action: Wait
Seconds: 60
```

Strava takes time to receive uploads. Wait to ensure the activity is available.

### 2. Load Credentials

```
Action: Get Value for Key from Data Jar
Key: "c-key.strava_client_id"
Save to: clientId

Action: Get Value for Key from Data Jar
Key: "c-key.strava_access_token"
Save to: accessToken

Action: Get Value for Key from Data Jar
Key: "c-key.strava_refresh_token"
Save to: refreshToken

Action: Get Value for Key from Data Jar
Key: "c-key.strava_token_expires_at"
Save to: tokenExpiresAt

Action: Get Value for Key from Data Jar
Key: "c-key.strava_client_secret"
Save to: clientSecret
```

### 3. First-Run Check

```
Action: If
Condition: clientId is empty

  Action: Show Alert
  Title: "Welcome to c-key"
  Message: "You need to set up Strava API credentials. This takes about 5 minutes."

  Action: Ask for Input
  Prompt: "Enter your Strava Client ID"
  Save to: clientId

  Action: Ask for Input
  Prompt: "Enter your Strava Client Secret"
  Input Type: Text (not visible for security)
  Save to: clientSecret

  Action: Set Value for Key in Data Jar
  Key: "c-key.strava_client_id"
  Value: clientId

  Action: Set Value for Key in Data Jar
  Key: "c-key.strava_client_secret"
  Value: clientSecret

  [Continue to OAuth flow in step 4a]

End If
```

### 4. Token Refresh Check

```
Action: Get Current Date
Format: Unix Timestamp
Save to: currentTime

Action: If
Condition: tokenExpiresAt < currentTime OR accessToken is empty

  [Refresh token flow - step 4a]

End If
```

### 4a. OAuth / Token Refresh

For first-time authorization:

```
Action: URL
https://www.strava.com/oauth/authorize?client_id=[clientId]&redirect_uri=ckey://oauth&response_type=code&scope=activity:read_all,activity:write

Action: Open URLs

[User authorizes in browser, redirected to ckey://oauth?code=XXX]

Action: Get URLs from Input
Save to: callbackURL

Action: Get Value for Key from Dictionary
Key: "code" (from URL parameters)
Save to: authCode

Action: Get Contents of URL
URL: https://www.strava.com/oauth/token
Method: POST
Headers: Content-Type: application/x-www-form-urlencoded
Body: client_id=[clientId]&client_secret=[clientSecret]&code=[authCode]&grant_type=authorization_code

Action: Get Value for Key from Dictionary
Key: "access_token"
Save to: accessToken

Action: Get Value for Key from Dictionary
Key: "refresh_token"
Save to: refreshToken

Action: Get Value for Key from Dictionary
Key: "expires_at"
Save to: tokenExpiresAt

[Store tokens in Data Jar]
```

For token refresh:

```
Action: Get Contents of URL
URL: https://www.strava.com/oauth/token
Method: POST
Headers: Content-Type: application/x-www-form-urlencoded
Body: client_id=[clientId]&client_secret=[clientSecret]&refresh_token=[refreshToken]&grant_type=refresh_token

[Same token extraction and storage as above]
```

### 5. Fetch Recent Activities

```
Action: Get Contents of URL
URL: https://www.strava.com/api/v3/athlete/activities?per_page=5
Method: GET
Headers: Authorization: Bearer [accessToken]
Save to: activities
```

### 6. Find Target Activity

```
Action: Repeat with Each
Items: activities

  Action: If
  Condition: Repeat Item.gear_id is empty

    Action: Set Variable
    Variable: targetActivity
    Value: Repeat Item

    Action: Exit Repeat

  End If

End Repeat

Action: If
Condition: targetActivity is empty

  Action: Show Notification
  Title: "c-key"
  Body: "No new activities to process"

  Action: Stop Shortcut

End If
```

### 7. Fetch Rules Engine

```
Action: Get Contents of URL
URL: https://lucazugic.github.io/c-key/c-key.js
Method: GET
Save to: engineBundle
```

### 8. Run Rules Engine

```
Action: Run JavaScript on Web Page

JavaScript Code:
(function() {
  const activity = JSON.parse('[targetActivity as JSON]');
  const rules = [/* bundled rules */];

  // Engine code inserted here from engineBundle
  [engineBundle]

  const plan = evaluateAndPlan(activity, rules);
  completion(JSON.stringify(plan));
})();

Input: (data URI containing HTML wrapper)
Save to: actionPlanJson

Action: Get Dictionary from Input
Input: actionPlanJson
Save to: actionPlan
```

### 9. Execute Actions

```
Action: Get Value for Key from Dictionary
Key: "actions"
Dictionary: actionPlan
Save to: actions

Action: Repeat with Each
Items: actions

  Action: If
  Condition: Repeat Item.type equals "Mute"

    Action: Get Contents of URL
    URL: https://www.strava.com/api/v3/activities/[targetActivity.id]
    Method: PUT
    Headers:
      Authorization: Bearer [accessToken]
      Content-Type: application/json
    Body: {"hide_from_home": true}

  End If

  Action: If
  Condition: Repeat Item.type equals "ChangeSportType"

    Action: Get Contents of URL
    URL: https://www.strava.com/api/v3/activities/[targetActivity.id]
    Method: PUT
    Headers: [same as above]
    Body: {"sport_type": "[Repeat Item.sport]"}

  End If

  Action: If
  Condition: Repeat Item.type equals "SetGear" AND Repeat Item.interactive is true

    Action: Choose from Menu
    Prompt: "Select gear for [targetActivity.name]"
    Options: [List of user's gear from Strava]
    Default: [Repeat Item.gearId]
    Save to: selectedGear

    Action: Get Contents of URL
    URL: https://www.strava.com/api/v3/activities/[targetActivity.id]
    Method: PUT
    Body: {"gear_id": "[selectedGear]"}

  End If

  Action: If
  Condition: Repeat Item.type equals "SetGear" AND Repeat Item.interactive is false

    Action: Get Contents of URL
    [Direct PUT without menu]

  End If

End Repeat
```

### 10. Log Result

```
Action: Get Current Date
Format: Unix Timestamp
Save to: timestamp

Action: Set Value for Key in Data Jar
Key: "c-key.last_run_timestamp"
Value: timestamp

Action: Set Value for Key in Data Jar
Key: "c-key.last_processed_activity_id"
Value: targetActivity.id

Action: Show Notification
Title: "c-key"
Body: "Processed: [targetActivity.name]"
```

## Error Handling

Wrap network requests in error handling:

```
Action: Get Contents of URL
[...]

Action: If
Condition: Result contains "error" OR HTTP status >= 400

  Action: Show Notification
  Title: "c-key Error"
  Body: "Failed to [action]. Check your internet connection."

  Action: Stop Shortcut

End If
```

## Custom URL Scheme

Register `ckey://` as the callback URL scheme. The Shortcut intercepts redirects to this scheme after OAuth authorization.

Note: iOS Shortcuts cannot register custom URL schemes directly. The workaround is to use `shortcuts://run-shortcut?name=c-key&input=text&text=` as the redirect URI, or to use a web-based OAuth flow that posts back to the Shortcut.

## Screenshots

*[Placeholder: Add screenshots of each major Shortcut section after building]*
