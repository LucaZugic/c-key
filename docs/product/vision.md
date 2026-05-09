# Product Vision

## The Problem

Strava is the dominant platform for tracking and sharing endurance activities. But it lacks granular, automated post-processing. Every run, ride, or workout requires manual intervention to set gear, hide from feeds, or adjust metadata. For a runner doing five runs a week with rotating shoes, that's twenty taps per week just for gear — assuming you remember.

Coros watches track gear natively. You tell the watch which shoe you're wearing before you start. But that data doesn't flow to Strava. The Coros-to-Strava sync copies the activity, the GPS, the splits — but not the gear assignment. Two systems, both with the data, neither talking to each other where it matters.

The gap is small but constant. It's the kind of friction that makes you stop bothering. Your Strava shoe mileage drifts from reality. Your strength sessions clutter your followers' feeds. Your short warm-up jogs show up as "runs" when they're not.

## The Solution

c-key is a rules engine for Strava activities. It sits between your watch and your profile, automatically applying the post-processing you'd do manually.

The flagship feature: when a Coros activity has gear attached, c-key propagates that assignment to the matching Strava activity. Your shoe mileage stays accurate without you lifting a finger.

But gear sync is just one rule. The engine is general:

- Strength training activities → mute from feeds
- Short runs under 2km → reclassify as warm-ups
- Evening runs → add a specific shoe (for those who don't set it on the watch)
- Commute rides → mark as commute automatically

Each user configures their own rules. The app evaluates them against incoming activities and applies the matching actions.

## Why On-Device

No backend. No server. No cloud function. No recurring cost.

This is deliberate. c-key is a personal tool for a single user (the developer, initially). Building server infrastructure for one person is wasteful. Running it indefinitely costs money. Debugging it requires ops skills.

The phone is powerful enough. HealthKit wakes the app when a new workout arrives. The app queries Strava, evaluates rules, and pushes updates. All on-device, all free after the initial Apple Developer Program fee.

If c-key ever scales beyond one user, the architecture supports it — ports and adapters would let us add a server-side option. But that's not the v0 goal.

## Who It's For

v0: the developer. One user, one set of rules, one set of integrations.

Potential future: runners and cyclists who use Coros watches and Strava, and who care about accurate gear tracking and clean activity feeds. People who geek out about their data. People frustrated by the same small annoyances week after week.

Not for: casual users who don't notice these gaps. Not for: people who want Strava features that the API doesn't support (private activities, map hiding).

## Success Criteria

c-key succeeds when:

1. Coros gear assignments automatically appear on Strava activities
2. The developer's shoe mileage is accurate without manual intervention
3. Strength sessions are muted without thinking about it
4. The app is invisible in daily use — it just works

Failure looks like:
- Manual intervention still required
- Rules don't fire reliably
- Coros integration breaks and takes the whole app down
- Battery drain from constant background processing

The architecture guards against failure: Coros breaking doesn't break the rest, background processing is event-driven not polling, rules are simple and debuggable.
