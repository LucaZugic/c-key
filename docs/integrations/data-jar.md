# Data Jar Integration

Data Jar is a third-party iOS app that provides persistent key-value storage for Shortcuts. c-key uses it to store OAuth tokens and configuration.

## Why Data Jar?

iOS Shortcuts has limited native storage options:
- **Shortcut variables**: Lost when the Shortcut completes
- **Global variables**: Shared across all Shortcuts, no namespacing
- **iCloud Drive files**: Possible but clunky for structured data

Data Jar solves these problems by providing:
- Persistent storage that survives Shortcut runs
- Namespaced keys (each Shortcut can have its own namespace)
- JSON-compatible values (strings, numbers, arrays, dictionaries)
- Shortcuts actions for read/write

## Data Stored

c-key stores the following in Data Jar:

### OAuth Credentials

| Key | Type | Description |
|-----|------|-------------|
| `strava_client_id` | string | User's Strava API app client ID |
| `strava_client_secret` | string | User's Strava API app client secret |
| `strava_access_token` | string | Current access token |
| `strava_refresh_token` | string | Refresh token for obtaining new access tokens |
| `strava_token_expires_at` | number | Unix timestamp when access token expires |

### State

| Key | Type | Description |
|-----|------|-------------|
| `last_run_timestamp` | number | Unix timestamp of last successful run |
| `last_processed_activity_id` | string | ID of the last activity processed |

### User Configuration (Future)

| Key | Type | Description |
|-----|------|-------------|
| `rules_override` | object | User's custom rule modifications |
| `default_gear` | object | Mapping of sport type to default gear |
| `notification_preferences` | object | Which events trigger notifications |

## Shortcut Actions

Data Jar provides these Shortcuts actions:

- **Get Value for Key**: Read a value by key
- **Set Value for Key**: Write a value to a key
- **Delete Key**: Remove a key-value pair
- **Get All Keys**: List all stored keys

Example usage in the Shortcut:

```
Get Value for Key "strava_access_token" from Data Jar
If [result] is empty
  → Run OAuth flow
Else
  → Use token for API calls
```

## Fallback: iCloud Drive JSON File

If the user does not have Data Jar installed, c-key falls back to storing data in a JSON file on iCloud Drive:

**Path**: `iCloud Drive/Shortcuts/c-key/config.json`

The Shortcut:
1. Checks if Data Jar is available
2. If not, reads/writes the JSON file using "Get File" and "Save File" actions
3. Parses/serializes JSON manually

This fallback is less elegant but works without additional app installation.

## Security Considerations

Data Jar storage is:
- **Local to the device**: Data is not synced to iCloud by default (user can enable sync)
- **Not encrypted**: Stored in plain text on the device
- **Accessible to other Shortcuts**: Any Shortcut can read any Data Jar key

For c-key, this is acceptable because:
- Strava tokens are already present in plain text during Shortcut execution
- The tokens grant access only to the user's own Strava account
- iOS device encryption protects data at rest

If stronger security is needed, a future native app could use the iOS Keychain.

## Initialization Flow

On first run:

1. Check if `strava_client_id` exists in Data Jar
2. If not, prompt user for client ID and secret
3. Store credentials in Data Jar
4. Run OAuth flow to obtain tokens
5. Store tokens in Data Jar
6. Continue with normal execution

On subsequent runs:

1. Read tokens from Data Jar
2. Check if access token is expired
3. If expired, refresh using refresh token and update Data Jar
4. Use access token for Strava API calls

## Data Jar App

Data Jar is developed by Simon Støvring and is available on the App Store. It is free with optional premium features.

- App Store: [Data Jar](https://apps.apple.com/app/data-jar/id1453273600)
- Documentation: [Data Jar Help](https://datajar.app/help)

c-key recommends but does not require Data Jar. The iCloud Drive fallback ensures the Shortcut works without it.
