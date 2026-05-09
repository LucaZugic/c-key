# Roadmap

Development proceeds in spikes and slices. Spikes prove technical feasibility; slices deliver user-facing functionality.

## Spike 0: Strava OAuth Round-Trip

**Goal**: Prove we can authenticate with Strava from an iOS Shortcut and make authenticated API calls.

**Deliverables**:
- Shortcut that opens Strava OAuth, captures the redirect, exchanges code for tokens
- Shortcut stores tokens in Data Jar
- Shortcut makes a test API call (GET /athlete) and displays the result
- Manual test: PUT `gear_id` on a known activity to prove write access

**Success criteria**: Activity gear updated via Shortcut-initiated API call.

**Not included**: Rules engine, automatic triggering, production polish.

## Slice 1: Manual Run with Rules Engine

**Goal**: User manually runs the Shortcut. It processes the most recent activity using the rules engine.

**Deliverables**:
- TypeScript rules engine with three rules (shoe by distance, mute strength, reclassify short runs)
- Engine bundled to single JS file, deployed to GitHub Pages
- Shortcut fetches bundle, runs engine, executes action plan
- Interactive gear selection with smart default

**Success criteria**: User taps Shortcut, sees gear selection menu, activity is updated.

**Not included**: Automatic triggering, error handling polish.

## Slice 2: HealthKit-Triggered Automation

**Goal**: Shortcut runs automatically when a workout ends.

**Deliverables**:
- Documentation for setting up Personal Automation
- 60-second delay to account for Strava upload latency
- Logic to find the newest unprocessed activity
- Tracking of last processed activity to avoid duplicates

**Success criteria**: Finish a run on watch, receive gear selection prompt without manual intervention.

**Not included**: Multiple activity handling (if several upload while phone is offline).

## Slice 3: Polish and Error Handling

**Goal**: Production-ready error handling and user experience.

**Deliverables**:
- Graceful handling of network errors, rate limits, expired tokens
- User-friendly error notifications
- Retry logic with exponential backoff
- Logging to Data Jar for debugging
- Handle edge cases (activity already has gear, activity deleted, etc.)

**Success criteria**: Shortcut handles failures gracefully without crashing or leaving corrupt state.

## Slice 4: Public Release

**Goal**: c-key is usable by strangers.

**Deliverables**:
- README with clear installation instructions
- RoutineHub listing with screenshots
- iCloud Shortcut link
- One Reddit post in r/Strava announcing the tool
- GitHub Sponsors / BuyMeACoffee link (optional)

**Success criteria**: A stranger can install and use c-key following only the README.

## Future (Post-v1)

These are not scheduled but represent potential future work:

- **Custom rules**: User edits rules via JSON in Data Jar
- **Rule editor UI**: Native app or web interface for configuring rules
- **Multiple gear categories**: Different defaults for tempo runs, long runs, easy runs
- **Notifications customization**: Choose which events trigger notifications
- **Activity history**: Log of processed activities and actions taken
- **Native iOS app**: Full app experience, Keychain storage, background refresh
- **Watch complication**: See last activity status from Apple Watch

## Timeline

No timeline estimates are provided. Work proceeds at sustainable pace. Each slice is complete when it meets the Definition of Done, not when a calendar date arrives.
