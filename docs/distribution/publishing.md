# Publishing

c-key is distributed through several channels. All are free and do not require app store approval.

## Distribution Channels

### GitHub Repository

**URL**: `https://github.com/LucaZugic/c-key`

The canonical source of truth. Contains:
- TypeScript rules engine source code
- Documentation (what you're reading now)
- Issue tracker for bugs and feature requests
- Release tags for versioning

This is where developers and curious users go to understand how c-key works.

### GitHub Pages (JS Bundle)

**URL**: `https://lucazugic.github.io/c-key/c-key.js`

The compiled rules engine bundle. This is what the Shortcut fetches at runtime.

Deployment:
- Triggered by GitHub Actions on tagged release
- Builds the TypeScript source with esbuild
- Deploys to the `gh-pages` branch
- Served via GitHub Pages at the URL above

Updates propagate automatically: tag a new version, the bundle updates, and all users get the new logic on their next Shortcut run.

### iCloud Shortcut Link

**URL**: `https://www.icloud.com/shortcuts/PLACEHOLDER`

The iOS Shortcut itself, hosted on Apple's iCloud servers. Users tap this link to install the Shortcut on their device.

To generate this link:
1. Build the Shortcut in the Shortcuts app
2. Tap the share button → "Copy iCloud Link"
3. The link is valid indefinitely

When updating the Shortcut:
1. Make changes in the Shortcuts app
2. Delete the old iCloud link (in Shortcuts → ... → Manage Links)
3. Generate a new link
4. Update the link in the README and documentation

### RoutineHub

**URL**: `https://routinehub.co/shortcut/PLACEHOLDER`

RoutineHub is a community directory for iOS Shortcuts. Benefits:
- Discoverability by Shortcuts enthusiasts
- Version tracking and update notifications
- Install count statistics
- User comments and ratings

To publish on RoutineHub:
1. Create an account at routinehub.co
2. Submit the Shortcut with description, screenshots, and iCloud link
3. Keep the listing updated when new versions release

### README on GitHub

The README serves as the landing page for anyone who finds c-key through search or social sharing. It should be:
- Concise (one screen of essential info)
- Actionable (clear installation link)
- Honest (what it does and does not do)

## Release Process

### For Bundle Updates (Logic Changes)

1. Merge changes to `main`
2. Run tests: `npm test`
3. Create a git tag: `git tag v0.1.0`
4. Push the tag: `git push origin v0.1.0`
5. GitHub Actions builds and deploys automatically
6. Users receive the update on next Shortcut run (no action required)

### For Shortcut Updates (Flow Changes)

1. Update the Shortcut in the Shortcuts app on your device
2. Test thoroughly
3. Generate a new iCloud link
4. Update links in README, docs, and RoutineHub
5. Notify users via GitHub release notes

Shortcut updates require users to re-download. They do not propagate automatically.

## Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (rule format change, new required config)
- **MINOR**: New features (new rule types, new actions)
- **PATCH**: Bug fixes, documentation updates

The bundle and Shortcut should have matching versions when possible. If they diverge (e.g., bundle is v1.2.0, Shortcut is v1.1.0), document compatibility.

## Analytics

c-key collects no analytics. There is no telemetry, no usage tracking, no crash reporting.

RoutineHub provides install counts. GitHub provides clone/download statistics. That's the extent of available metrics.
