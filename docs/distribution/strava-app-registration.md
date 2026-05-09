# Strava API App Registration

c-key requires each user to register their own Strava API application. This sidesteps Strava's per-app athlete limit and keeps c-key independent.

This process takes about 5 minutes and is free.

## Why You Need Your Own App

Strava limits each registered API application to a small number of authenticated athletes by default. Rather than apply for increased limits (which requires business justification), c-key has each user create their own app. Your app authenticates only you, so limits are never an issue.

This is a common pattern for personal automation tools and is explicitly allowed by Strava's API terms.

## Step-by-Step Registration

### 1. Go to Strava Developer Portal

Open [developers.strava.com](https://developers.strava.com) in your browser.

### 2. Log In

Click "Log In" and sign in with your regular Strava account.

### 3. Create a New App

After logging in, you'll see the API dashboard. Click "Create App" or find the option in My API Application.

### 4. Fill Out the Form

| Field | Value |
|-------|-------|
| Application Name | `c-key` (or any name you like) |
| Category | `Other` |
| Club | Leave blank |
| Website | `https://github.com/LucaZugic/c-key` |
| Application Description | `Personal activity automation` |
| Authorization Callback Domain | `localhost` |

**Important**: The Authorization Callback Domain should be `localhost`. c-key's Shortcut uses a local redirect for the OAuth flow.

### 5. Accept Terms

Check the box to agree to Strava's API Agreement.

### 6. Create the App

Click "Create" or "Submit". Your app is now registered.

### 7. Find Your Credentials

On the app settings page, you'll see:

- **Client ID**: A number like `12345`
- **Client Secret**: A long alphanumeric string

Copy both values. You'll paste them into c-key during first run.

## Keeping Your Credentials Safe

- Do not share your Client Secret publicly
- Do not commit credentials to version control
- c-key stores credentials locally on your device in Data Jar

If you accidentally expose your Client Secret, return to the Strava developer portal and regenerate it.

## Changing App Settings Later

You can return to [developers.strava.com](https://developers.strava.com) at any time to:

- View your app's usage statistics
- Regenerate your Client Secret
- Update the app description
- Delete the app entirely

## Troubleshooting

### "Invalid Client ID"

Double-check the number you entered. Client IDs are numeric only (no letters).

### "Invalid Client Secret"

Client Secrets are long and easy to mis-copy. Try copying again, ensuring you get the entire string without extra spaces.

### "Redirect URI Mismatch"

Ensure your Authorization Callback Domain is set to `localhost` (not `http://localhost` or `localhost:8080`, just `localhost`).

### "Scope Not Allowed"

c-key requests `activity:read_all` and `activity:write` scopes. These are available to all apps by default. If you see a scope error, ensure you're authorizing with your own app credentials, not someone else's.

## Screenshots

*[Placeholder: Screenshots will be added showing each step of the registration process]*

1. Strava developer portal homepage
2. Create app form filled out
3. App settings page showing Client ID and Secret
