# c-key

*Smart per-activity rules for Strava, on iOS Shortcuts.*

c-key is an iOS Shortcut that automatically processes your Strava activities. It tags shoes based on distance, mutes strength training from your feed, and reclassifies tiny runs as workouts. Configurable rules, zero subscription, works with any watch that uploads to Strava.

## Status

Pre-alpha. Not yet ready for public use.

## Quick Start

1. **Install the Shortcut**: [c-key on iCloud](https://www.icloud.com/shortcuts/PLACEHOLDER) *(link coming soon)*
2. **Register your Strava API app**: [Setup guide](docs/distribution/strava-app-registration.md)
3. **Run c-key** and enter your credentials when prompted
4. **Set up automation**: Shortcuts > Automation > Health > Workout Is Logged > Run c-key

Detailed instructions: [User Setup Guide](docs/distribution/user-setup.md)

## How It Works

c-key has two parts:

1. **iOS Shortcut** handles triggers, OAuth, and API calls
2. **Rules engine** (TypeScript) evaluates rules and decides what to do

The Shortcut runs when you finish a workout. It fetches the rules engine from GitHub Pages, evaluates your activity against the rules, and executes the resulting actions (set gear, mute, change sport type).

Everything runs on your iPhone. Nothing is sent to a server.

## Rules (v1)

| Rule | What it does |
|------|--------------|
| Shoe by distance | Suggests running shoes based on distance. You confirm with one tap. |
| Mute strength | Automatically hides weight training from your feed. |
| Reclassify short runs | Runs under 2km become "Workout" and are muted. |

## Privacy

- c-key stores your Strava credentials locally on your device
- API calls go directly from your phone to Strava
- No telemetry, no analytics, no backend server
- You register your own Strava API app (no shared credentials)

## For Developers

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Build bundle
npm run build
```

Requires Node.js 20+.

## Documentation

Full documentation is in the `docs/` directory:

- [Architecture](docs/architecture/overview.md)
- [Domain Model](docs/architecture/domain-model.md)
- [Strava Integration](docs/integrations/strava.md)
- [Ways of Working](docs/ways-of-working/tdd.md)

## License

MIT. See [LICENSE](LICENSE).

## Disclaimer

c-key is not affiliated with Strava, Inc. "Strava" is a trademark of Strava, Inc.

The name "c-key" is a phonetic rendering of "Siqi," a personal name. It is not an acronym.

---

*Made with care in Manchester.*
