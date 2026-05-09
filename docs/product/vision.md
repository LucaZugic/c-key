# Product Vision

Strava lacks granular per-activity automation. When a new activity uploads, you get what you get: whatever sport type your watch recorded, no gear assigned, visible in your feed regardless of whether you want it there. c-key fills this gap with a rules engine that automatically processes activities based on configurable conditions.

The product is designed for a single user (the developer) but distributed publicly so anyone can use it. There is no multi-tenancy, no user accounts, no server. Each user runs their own instance via an iOS Shortcut backed by their own Strava API credentials. This architecture keeps costs at zero and complexity low.

## The Pivot Story

c-key originally targeted a native iOS Swift app that would sync gear assignments from Coros watches to Strava. The Coros watch tracks which shoes you wore; Strava does not automatically receive this information. The plan was to bridge that gap.

Live testing proved this impossible. The Coros Training Hub API, both the unofficial version reverse-engineered by the community and the official partner API, does not expose gear data. Activities come through with performance metrics but no equipment information. The gear tracking feature exists only in the Coros mobile app UI and is not accessible programmatically.

Rather than abandon the project, we pivoted. The new approach drops Coros entirely and implements Strava-only rules using heuristics. Instead of "propagate Coros gear to Strava," the product is "automatically assign gear on Strava based on distance, sport type, and other signals." This is actually a better product: it works for everyone regardless of watch brand (Garmin, Apple Watch, Wahoo, Polar, Suunto, Coros, or manual upload).

## The Name

c-key is a phonetic rendering of "Siqi," the developer's partner's nickname. She uses this name with non-Chinese speakers. It is not an acronym, not a reference to keyboard shortcuts, and not a reference to keys and locks. Pronounced "see-key." The lowercase spelling with hyphen is intentional and should be used consistently except in TypeScript identifiers where `CKey` is acceptable.

## Core Value Proposition

**For Strava users who want smarter activity defaults**, c-key is an iOS Shortcut that automatically tags shoes, mutes unwanted activities, and reclassifies edge cases. Unlike Strava's built-in defaults (which are static), c-key applies configurable rules that adapt to each activity's properties.

## Non-Goals

- c-key is not a Strava replacement or alternative interface
- c-key does not display activity data or provide analytics
- c-key does not sync between services (it only reads from and writes to Strava)
- c-key does not require a subscription or recurring payment
- c-key is not affiliated with Strava, Inc.
