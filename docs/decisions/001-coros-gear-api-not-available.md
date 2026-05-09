# ADR-001: Coros Gear API Not Available

**Status:** Accepted
**Date:** 2026-05-09
**Author:** Luca Zugic

## Context

The original goal of **c-key** was to automatically propagate gear assignments (running shoes, bikes) from Coros to Strava after each activity sync. This would save users from manually updating gear on Strava for every activity.

## Investigation

We conducted a thorough investigation of the Coros Training Hub API:

### Sources Examined
- [cygnusb/coros-mcp](https://github.com/cygnusb/coros-mcp) - Python MCP server for Coros
- [jmn8718/coros-connect](https://github.com/jmn8718/coros-connect) - TypeScript Coros API client
- [xballoy/coros-api](https://github.com/xballoy/coros-api) - Activity exporter
- [Coros Help Center - Gear Tracking](https://support.coros.com/hc/en-us/articles/30206047249556-Gear-Tracking)

### API Endpoints Discovered

| Endpoint | Purpose |
|----------|---------|
| `account/login` | Authentication |
| `account/query` | Profile info |
| `activity/query` | List activities |
| `activity/detail/query` | Activity details |
| `activity/update` | Update activity metadata |
| `activity/fit/import` | Upload activities |

### Live API Response (2026-05-09)

We authenticated and fetched real activity data. Sample response for a 2.14 km run:

```json
{
  "name": "Salford Run",
  "distance": 2140.18,
  "device": "COROS PACE 4",
  "deviceId": "F1A807",
  "sportType": 100,
  "avgHr": 133,
  "avgPower": 236,
  "cadence": 153,
  "step": 2497
  // ... performance metrics only
}
```

**Fields searched for but not found:**
- `gear`, `gearId`
- `shoe`, `shoes`
- `bike`
- `equipment`
- `sportDevice`

## Findings

1. **Gear tracking exists in Coros** - Users can assign shoes/bikes to activities via the mobile app
2. **Gear data is NOT exposed via API** - None of the known unofficial API endpoints return gear information
3. **No official public API** - Coros offers an [API application process](https://support.coros.com/hc/en-us/articles/17085887816340-Submitting-an-API-Application) with custom pricing, but documentation is not public
4. **`device` ≠ gear** - The `device` field refers to the Coros watch model, not running shoes or bikes

## Decision

**The Coros → Strava gear sync feature is not feasible** with current API access.

The gear assignment data is siloed within the Coros mobile app and not exposed through any known API endpoint.

## Alternatives Considered

| Option | Feasibility | Notes |
|--------|-------------|-------|
| Official Coros API | Unknown | Requires application, custom pricing, unclear if gear is included |
| Reverse-engineer mobile app | High effort | Would need to intercept app traffic, fragile |
| Manual gear mapping in app | Possible | User maps sport types → Strava gear |
| iOS Shortcuts | Possible | Simpler approach, user-triggered |
| Strava-only solution | Possible | Rules based on activity name/type, no Coros dependency |

## Consequence

Pivoting away from the native iOS app approach. Likely direction: **iOS Shortcuts** for Strava gear automation, removing Coros dependency entirely.

## Lessons Learned

- Always validate API capabilities before committing to a feature
- "Unofficial APIs" often lack the specific data needed for niche use cases
- Gear/equipment tracking is apparently not a priority for fitness API providers
