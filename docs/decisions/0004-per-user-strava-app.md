# ADR-0004: Per-User Strava API App Registration

## Status

Accepted

## Context

Strava's API has usage limits. By default, each registered API application is limited to authenticating a small number of athletes (the exact cap varies but is typically very restrictive for personal projects). Exceeding this limit requires applying for partnership status, which involves business justification and legal agreements.

c-key is a personal automation tool. It has no business entity behind it, no revenue model, and no way to justify partnership status.

Options considered:
1. Apply for Strava partnership (unlikely to succeed)
2. Limit c-key to a single user (defeats the purpose of public distribution)
3. Have each user register their own Strava API app

## Decision

Each c-key user registers their own Strava API application at developers.strava.com. They paste their Client ID and Client Secret into c-key during first-run setup.

This means:
- Each user's app has only one authenticated athlete: themselves
- No per-app athlete limit is ever reached
- c-key has no shared credentials to manage or protect
- Users have full control over their API access

## Consequences

**Benefits**:
- No athlete cap issues, ever
- No partnership requirements
- No central point of failure (c-key doesn't hold any tokens)
- Users can revoke access independently
- Fully compliant with Strava's terms of service

**Drawbacks**:
- Additional setup step for users (5 minutes)
- Documentation must clearly guide through registration
- Users must keep their Client Secret secure
- If a user loses their credentials, they must create a new app

**Trade-off accepted**: The 5-minute setup cost is far preferable to partnership bureaucracy or artificial user limits.

## Date

2026-05-09
