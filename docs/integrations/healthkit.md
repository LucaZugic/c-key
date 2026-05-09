# HealthKit Integration

c-key uses HealthKit indirectly through iOS Shortcuts' Personal Automation feature. This enables the Shortcut to run automatically when a workout ends.

## The Trigger

iOS Shortcuts supports automation triggers based on HealthKit events. The relevant trigger for c-key is:

**"When a workout is logged in the Health app"**

This fires when:
- A workout recorded on Apple Watch syncs to the iPhone
- A third-party app (Strava, Garmin Connect, Coros) writes a workout to HealthKit
- The user manually logs a workout in the Health app

Most fitness watches and apps write to HealthKit, so this trigger catches workouts regardless of the recording device.

## Setting Up the Automation

The user creates a Personal Automation in the Shortcuts app:

1. Open Shortcuts > Automation tab > + New Automation
2. Select "Health" as the trigger type
3. Choose "Workout" > "Any Workout" > "Is Logged"
4. Set "Run Immediately" (no confirmation prompt)
5. Add action: "Run Shortcut" > select c-key

Once configured, the Shortcut runs automatically every time a workout is logged. No user interaction required.

## Timing Considerations

There's a race condition between HealthKit and Strava:

1. User finishes workout on watch
2. Watch syncs to phone; HealthKit receives the workout
3. Shortcuts automation fires (c-key Shortcut starts)
4. Meanwhile, watch app uploads to Strava (takes 30-90 seconds)
5. c-key queries Strava for new activities

If c-key queries Strava before the upload completes, it won't find the new activity.

**Solution**: The Shortcut waits 60 seconds before querying Strava. This gives most watch apps time to complete the upload. The wait is implemented with a Shortcuts "Wait" action at the start of the flow.

If 60 seconds is insufficient (slow network, large activity with GPS data), the user can manually re-run the Shortcut later.

## Permissions

The automation trigger does not require c-key to read HealthKit data directly. The trigger is handled by iOS; the Shortcut just runs when the event occurs.

c-key has no HealthKit entitlements and cannot read workout details from HealthKit. All activity data comes from Strava.

## Fallback: Manual Execution

If the automation fails or the user disables it, c-key can be run manually:

- Tap the Shortcut in the Shortcuts app
- Add the Shortcut to the home screen and tap the icon
- Ask Siri: "Run c-key"

Manual execution processes the most recent Strava activity without gear assigned, same as automated execution.

## Limitations

### Only iOS

Personal Automations are iOS-only. There is no equivalent on macOS, iPadOS (without Shortcuts app), or other platforms. c-key is an iOS-first product.

### User must enable the automation

iOS does not allow apps to create automations programmatically. The user must manually set up the Health trigger after installing the Shortcut. This is documented in the user setup guide.

### Automation may be disabled by iOS

iOS sometimes disables automations after major updates or if it detects unexpected behavior. Users should check that their automation is still enabled if c-key stops running automatically.

### No workout type filtering in trigger

The "Workout Is Logged" trigger fires for all workout types. c-key cannot filter at the trigger level (e.g., "only runs"). Filtering happens inside the Shortcut by checking the Strava activity's sport type.

## Future Considerations

If c-key becomes a native iOS app, it could:
- Register for HealthKit background delivery to receive workout updates directly
- Read workout details from HealthKit for faster processing (no Strava latency)
- Support Apple Watch complications showing rule status

For v1 (Shortcut-based), the Personal Automation approach is sufficient and requires no app development.
