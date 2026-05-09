# ADR 0002: On-Device Only, No Backend

## Status

Accepted

## Date

2025-01-15

## Context

c-key could be architected with a backend server that handles API calls, stores rules, and processes activities. Alternatively, it can run entirely on the user's iPhone.

Considerations:

- The app is for a single user (the developer) in v0
- Running a server costs money monthly, indefinitely
- Server infrastructure requires ops knowledge and monitoring
- Strava webhooks require a publicly accessible endpoint
- HealthKit can trigger background processing on-device

## Decision

c-key runs entirely on-device. There is no backend server, no cloud functions, and no recurring infrastructure cost.

The phone handles:
- OAuth token storage (Keychain)
- Rule storage (local files)
- API calls to Strava and Coros
- Background processing triggered by HealthKit

The only cost is the Apple Developer Program fee (required for HealthKit entitlements and TestFlight).

## Consequences

### Positive

- Zero recurring cost after initial Apple Developer fee
- No server to maintain, monitor, or secure
- No network dependency between user and a middle tier
- Data stays on device (privacy)
- Simpler architecture overall

### Negative

- Cannot use Strava webhooks (they require a server endpoint)
- Background processing depends on iOS battery optimization
- If HealthKit doesn't fire reliably, we need fallback polling
- Cannot easily add multi-user features later without server
- No centralized logging or error tracking

### Neutral

- User must keep the app installed and permissions granted
- Processing happens when iOS decides to wake the app
