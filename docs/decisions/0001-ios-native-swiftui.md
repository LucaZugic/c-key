# ADR 0001: iOS Native with SwiftUI

## Status

Accepted

## Date

2025-01-15

## Context

c-key needs to run on iOS to access HealthKit for background activity detection and Keychain for secure token storage. We need to choose a UI framework and development approach.

Options considered:

1. **Native Swift with SwiftUI** — Apple's modern declarative UI framework
2. **Native Swift with UIKit** — Apple's traditional imperative UI framework
3. **React Native** — Cross-platform JavaScript framework
4. **Flutter** — Cross-platform Dart framework

The app is single-platform (iOS only). There's no Android version planned. The developer has Swift experience from personal projects.

## Decision

We use native iOS development with SwiftUI for the user interface.

SwiftUI is Apple's direction for iOS development. It integrates cleanly with HealthKit, Keychain, and background task APIs. The declarative paradigm aligns with the domain-driven approach we're taking.

UIKit was considered but rejected because SwiftUI is sufficient for our UI needs and produces less boilerplate.

Cross-platform frameworks were rejected because:
- We only need iOS
- HealthKit integration is easier in native Swift
- Additional abstraction layers add complexity without benefit

## Consequences

### Positive

- Native performance and feel
- Direct access to HealthKit and Keychain without bridging
- SwiftUI's declarative syntax is concise
- Strong typing catches errors at compile time
- Active Apple support and documentation

### Negative

- SwiftUI has platform version requirements (iOS 14+ for most features we need)
- No code sharing if we ever want Android (unlikely)
- Learning curve for advanced SwiftUI patterns

### Neutral

- Requires Xcode for development
- Requires macOS development machine
