# User Setup Guide

This guide walks you through installing and configuring c-key on your iPhone.

## Prerequisites

- iPhone running iOS 16 or later
- Shortcuts app (pre-installed on iOS)
- Strava account with at least one activity
- 10 minutes for initial setup

## Step 1: Install the Shortcut

1. Open the c-key iCloud link on your iPhone: [c-key Shortcut](https://www.icloud.com/shortcuts/PLACEHOLDER)
2. Tap "Add Shortcut" when prompted
3. The Shortcut appears in your Shortcuts app

## Step 2: Register Your Strava API App

c-key requires you to create your own Strava API application. This takes about 5 minutes and is free.

See the detailed guide: [Strava App Registration](strava-app-registration.md)

After completing registration, you will have:
- A Client ID (a number like `12345`)
- A Client Secret (a long string)

Keep these handy for the next step.

## Step 3: First Run - Enter Credentials

1. Open the Shortcuts app
2. Find c-key and tap to run it
3. When prompted, enter your Strava Client ID
4. When prompted, enter your Strava Client Secret
5. A Strava authorization page opens in Safari
6. Tap "Authorize" to grant c-key access
7. You're redirected back to Shortcuts (this may take a moment)
8. c-key displays a test message confirming the connection

Your credentials are now stored securely. You won't need to enter them again.

## Step 4: Set Up Automatic Triggering

To run c-key automatically after every workout:

1. Open the Shortcuts app
2. Tap the "Automation" tab at the bottom
3. Tap the "+" button to create a new automation
4. Select "Health"
5. Select "Workout" → "Any Workout" → "Is Logged"
6. Tap "Next"
7. Tap "New Blank Automation" (or search for actions)
8. Add action: "Run Shortcut"
9. Select "c-key" from the list
10. Tap "Next"
11. Toggle OFF "Ask Before Running"
12. Tap "Done"

Now, whenever a workout is logged to the Health app (from your watch, Strava, or any fitness app), c-key runs automatically.

## Step 5: Verify It Works

1. Record a short activity on your watch (or log one manually in Strava)
2. Wait 2 minutes for the upload and c-key to process
3. Check the activity in Strava - it should have gear assigned (or be muted, depending on the rules that matched)

If you don't see changes:
- Check that the automation is enabled (Shortcuts → Automation → c-key trigger)
- Run c-key manually to see if there are any error messages
- Ensure your Strava API app has the correct permissions (activity:read_all and activity:write)

## Troubleshooting

### "Authorization Failed"

Your Strava API credentials may be incorrect. Run c-key, and when prompted, re-enter your Client ID and Secret. Double-check for typos.

### "No Activities Found"

c-key looks for activities without gear assigned. If all your recent activities have gear, there's nothing to process. Create a test activity without gear.

### "Rate Limited"

Strava limits API calls to 100 per 15 minutes. If you've been testing heavily, wait 15 minutes and try again.

### Automation Doesn't Run

iOS sometimes disables automations after updates. Check Shortcuts → Automation and ensure your c-key trigger is enabled (not greyed out).

## Uninstalling

To remove c-key:

1. Delete the Shortcut from the Shortcuts app
2. Delete the automation trigger (Shortcuts → Automation → swipe left on c-key trigger)
3. Revoke API access in Strava: Settings → My Apps → c-key → Revoke Access
4. Optionally, delete your Strava API app at developers.strava.com

Your Strava activities are not affected by uninstalling c-key.
