# c-key

*the missing key between your watch and Strava*

c-key is an iOS app that runs user-defined rules over Strava activities. It automatically propagates Coros gear assignments to Strava, mutes strength sessions from feeds, reclassifies short runs, and more — all without manual intervention.

## Status

Pre-alpha. Single-user (the developer). Not yet on the App Store.

## Documentation

Full documentation is available in the `docs/` directory. To view it as a site:

```bash
pip install mkdocs mkdocs-material
mkdocs serve
```

Then open http://127.0.0.1:8000 in your browser.

Key documents:
- [Architecture Overview](docs/architecture/overview.md)
- [Rules Engine](docs/product/rules-engine.md)
- [Roadmap](docs/product/roadmap.md)

## Requirements

- Xcode 15+
- iOS 17+ (deployment target)
- Python 3.11+ (for MkDocs only)
- Apple Developer Program membership (for HealthKit entitlements)

## Security

No Strava or Coros credentials are checked into this repository. Tokens are stored in the iOS Keychain. Never commit secrets.

## Name and Trademarks

c-key is a personal project. It is not affiliated with, endorsed by, or sponsored by Strava, Inc. or Coros Wearables Inc.

The name "c-key" is the developer's partner's nickname (a phonetic rendering of "Siqi" for non-Chinese speakers). It is not an acronym or descriptor.

Strava and Coros are trademarks of their respective owners.

## License

See [LICENSE](LICENSE) for details.
