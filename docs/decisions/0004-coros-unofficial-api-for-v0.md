# ADR 0004: Coros Unofficial Training Hub API for v0

## Status

Accepted

## Date

2025-01-15

## Context

Coros watches track which gear (shoes) is used for each activity. This data doesn't sync to Strava. c-key's flagship feature is bridging this gap.

Coros offers two API options:

1. **Open API (Official)**: OAuth2-based, documented, stable. But requires partner application approval. Not available to individual developers for personal projects.

2. **Training Hub API (Unofficial)**: The same API the Coros web app uses. Email/password authentication, session tokens. Undocumented, reverse-engineered, can break at any time.

We applied for Open API access but have not received approval.

## Decision

For v0, we use the unofficial Coros Training Hub API.

This is acceptable because:
- Single user (the developer), personal use only
- No commercial or at-scale usage
- The feature doesn't work without it
- The architecture (ports/adapters) contains the fragility

Mitigation:
- Coros adapter throws a distinct error type (`CorosAdapterUnavailable`)
- Use cases handle this error gracefully (skip gear sync, log warning)
- Other rules still evaluate
- User sees a warning in UI
- Application for Open API access continues in parallel

If/when Open API access is granted, we build a second adapter and swap it in.

## Consequences

### Positive

- The flagship feature works in v0
- No waiting for partner approval
- Proves the concept before investing in official integration

### Negative

- Can break without warning when Coros changes their web app
- Possibly violates Coros ToS (acceptable for personal use, not at scale)
- Requires monitoring and quick response to breakage
- Auth flow is less secure (password-based, not OAuth)

### Neutral

- Credentials are exchanged for token immediately, not stored
- Session tokens stored in Keychain like OAuth tokens
- Same `CorosActivityRepository` port whether official or unofficial
