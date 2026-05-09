# ADR-0007: No Coros API Integration

## Status

Accepted

## Context

The original c-key concept was to sync gear assignments from Coros watches to Strava. Coros allows users to assign shoes and bikes to activities in the Coros Training Hub app. Strava does not receive this information when activities sync. The plan was to read gear from Coros and write it to Strava.

Live testing in May 2026 revealed that this is impossible:

1. **Unofficial Training Hub API**: Reverse-engineered by the community (coros-mcp, coros-connect, coros-api projects). Supports activity queries, workout management, sleep data, and metrics. Does not expose gear/equipment data. We probed multiple endpoints and inspected raw responses; no gear fields exist.

2. **Activity detail responses**: Contain performance metrics (HR, power, pace, distance) and device info (watch model, device ID). No shoe or bike references.

3. **Account/profile endpoints**: Return user settings, training zones, preferences. No gear list or gear assignments.

4. **Official Coros Open API**: Requires partnership application and has custom pricing. Documentation is not public. Even if gear were available, the cost and complexity would not align with c-key's zero-cost constraint.

The gear tracking feature is visible in the Coros mobile app UI but is not exposed through any known API endpoint.

## Decision

Do not integrate with Coros. Do not write code that calls Coros endpoints. Do not define Coros types or adapters.

c-key is a Strava-only tool that uses heuristics (distance, sport type, time of day) to suggest gear instead of syncing from the watch.

This is not a temporary decision pending Coros API changes. It is a permanent architectural boundary.

## Consequences

**Benefits**:
- Simpler architecture (one external service, not two)
- Works for all users regardless of watch brand
- No dependency on an unofficial, unstable API
- No risk of Coros breaking changes affecting c-key

**Drawbacks**:
- Cannot provide ground-truth gear assignments
- Heuristics may suggest the wrong shoe
- Users must confirm or correct gear selections

**Accepted trade-off**: An imperfect heuristic-based solution that works for everyone is better than a perfect solution that is technically impossible.

## Date

2026-05-09
