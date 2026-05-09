# ADR-0001: Pivot from Native iOS App to iOS Shortcut

## Status

Accepted

## Context

The original vision for c-key was a native iOS Swift app that would sync gear assignments from Coros watches to Strava. This required:

1. Apple Developer Program membership ($99/year)
2. App Store review process
3. Ongoing maintenance of a Swift codebase
4. Users downloading an app from the App Store

Additionally, live testing revealed that the Coros API does not expose gear data, making the original feature impossible (see ADR-0007).

iOS Shortcuts provide an alternative runtime for automation tasks. Shortcuts can:
- Trigger on HealthKit events (workout end)
- Make HTTP requests (Strava API)
- Execute JavaScript (rules engine)
- Present native UI (menus, notifications)
- Store data persistently (Data Jar)

## Decision

Build c-key as an iOS Shortcut backed by a TypeScript rules engine, not as a native Swift app.

The Shortcut handles platform concerns (OAuth, triggers, storage, UI). The rules engine is pure TypeScript bundled to JavaScript and hosted on GitHub Pages. The Shortcut fetches the engine at runtime.

## Consequences

**Benefits**:
- No Apple Developer Program membership required
- No App Store review process
- Instant updates (new bundle deploys immediately)
- Rules engine is testable with standard JavaScript tools
- Engine is portable to other runtimes (future native app, web extension)
- Zero distribution friction (iCloud link install)

**Drawbacks**:
- Weaker UI capabilities (no custom views, limited layout control)
- Shortcut is a binary plist, harder to version control than source code
- Users must manually set up the HealthKit trigger
- Debugging is harder (no Xcode, limited logging)

**Trade-off accepted**: The benefits of zero-friction distribution and rapid iteration outweigh the UI limitations for this automation-focused tool.

## Date

2026-05-09
