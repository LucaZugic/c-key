# Storage: iCloud Drive

c-key uses native iCloud Drive for all persistent storage. **No third-party apps required.**

## Why iCloud Drive?

iOS Shortcuts has built-in file actions:
- **Get File**: Read files from iCloud Drive
- **Save File**: Write files to iCloud Drive

This provides:
- Persistent storage that survives Shortcut runs
- Automatic sync across devices via iCloud
- No additional app installation required
- Native iOS experience

## Storage Location

```
iCloud Drive/Shortcuts/c-key/config.json
```

The `Shortcuts` folder is a standard location that Shortcuts can access without additional permissions.

## Data Stored

### config.json

```json
{
  "client_id": "12345",
  "client_secret": "abc123def456...",
  "access_token": "xyz789...",
  "refresh_token": "ghi012...",
  "expires_at": 1704067200
}
```

| Field | Type | Description |
|-------|------|-------------|
| `client_id` | string | User's Strava API app client ID |
| `client_secret` | string | User's Strava API app client secret |
| `access_token` | string | Current OAuth access token |
| `refresh_token` | string | Token for obtaining new access tokens |
| `expires_at` | number | Unix timestamp when access token expires |

### Rules

Rules are **baked directly into the Shortcut** as a Text block. This:
- Eliminates external storage for rules
- Makes rules self-contained within the Shortcut
- Requires editing the Shortcut to change rules (acceptable for v1)

Future versions may support user-editable rules in a separate file.

## Shortcut Actions Used

### Reading Config

```
Action: Get File
Path: Shortcuts/c-key/config.json
Service: iCloud Drive

Action: Get Dictionary from [file contents]
```

### Writing Config

```
Action: Text
Content: [config as JSON string]

Action: Save File
Input: [text]
Path: Shortcuts/c-key/config.json
Service: iCloud Drive
Overwrite: true
```

## Initialization Flow

On first run (config.json doesn't exist):

1. Prompt user for Strava Client ID
2. Prompt user for Client Secret
3. Run OAuth authorization flow
4. Create config.json with all credentials
5. Save to iCloud Drive

On subsequent runs:

1. Read config.json from iCloud Drive
2. Check if access token is expired
3. If expired, refresh token and update config.json
4. Use access token for Strava API calls

## Security Considerations

iCloud Drive storage is:
- **Encrypted in transit**: Via iCloud
- **Encrypted at rest**: Via iOS device encryption and iCloud encryption
- **Synced across devices**: User's iCloud-connected devices can access

For c-key, this is acceptable because:
- Strava tokens grant access only to the user's own account
- The user controls which devices have iCloud access
- iOS provides strong device-level security

## Previous Approach: Data Jar

Earlier versions of this document described using Data Jar, a third-party app. This approach was rejected to:
- Eliminate third-party dependencies
- Simplify installation (no app required)
- Use native iOS capabilities

The iCloud Drive approach provides equivalent functionality with fewer moving parts.
