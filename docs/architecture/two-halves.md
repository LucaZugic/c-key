# The Two Halves

c-key's architecture deliberately separates platform concerns from domain logic into two independently evolving components.

## The Shortcut Half

The iOS Shortcut is a thin orchestrator. It knows how to:

- **Trigger on workout end**: Via iOS Personal Automation and HealthKit integration, the Shortcut runs automatically when a workout completes.
- **Manage OAuth**: Open a web view for Strava authorization, capture the redirect, exchange the code for tokens, and refresh tokens when they expire.
- **Store secrets**: Use Data Jar (or a fallback iCloud Drive JSON file) to persist the Strava client ID, client secret, refresh token, and user preferences.
- **Fetch the engine bundle**: Make an HTTP request to GitHub Pages to retrieve the latest `c-key.js` file.
- **Execute JavaScript**: Use the "Run JavaScript on Web Page" action (via a data URI trick) to evaluate the engine bundle and call its entry point.
- **Present UI**: Show native iOS menus for user confirmation (e.g., selecting a shoe from a list), display notifications, and handle errors gracefully.
- **Call Strava API**: Execute the action plan by making PUT requests to update activities.

The Shortcut makes no domain decisions. It does not know what a "rule" is, how to evaluate filters, or how to resolve conflicts. It treats the engine as a black box.

## The Engine Half

The TypeScript rules engine is a pure function of its inputs. It knows how to:

- **Parse activities**: Understand the structure of a Strava activity (sport type, distance, gear, name, etc.).
- **Evaluate rules**: Apply each rule's filters to an activity and determine which rules match.
- **Plan actions**: Collect all matching rules' actions into a deduplicated, ordered action plan.
- **Resolve conflicts**: When multiple rules target the same field (e.g., two rules both set `gear_id`), apply a deterministic resolution strategy (later rules win).

The engine has no knowledge of HTTP, iOS, OAuth, or any external service. It receives an `Activity` object and a `Rule[]` array; it returns an `ActionPlan`. That is the entire interface.

## How Updates Propagate

The engine bundle is hosted at a stable URL on GitHub Pages (e.g., `https://lucazugic.github.io/c-key/c-key.js`). When a new version is tagged in the repository:

1. GitHub Actions builds the bundle via esbuild.
2. The bundle is deployed to the `gh-pages` branch.
3. GitHub Pages serves the new bundle at the same URL.

The next time any user's Shortcut runs, it fetches the latest bundle. No user action required, no app update, no re-installation. This is the same update model used by web applications.

## What Lives Where

| Concern | Lives In |
|---------|----------|
| HealthKit workout trigger | Shortcut |
| OAuth token exchange | Shortcut |
| Token refresh | Shortcut |
| Secure token storage | Shortcut (Data Jar) |
| Fetching the JS bundle | Shortcut |
| Rule evaluation | Engine |
| Filter matching | Engine |
| Action planning | Engine |
| Conflict resolution | Engine |
| Strava API calls | Shortcut |
| User confirmation UI | Shortcut |
| Error notifications | Shortcut |

## The Contract in Detail

```typescript
// Input: the activity to process
interface Activity {
  id: string;
  name: string;
  sportType: Sport;
  distance: number;      // meters
  movingTime: number;    // seconds
  startDate: Date;
  gearId: string | null;
}

// Input: the user's configured rules
interface Rule {
  id: string;
  name: string;
  filters: Filter[];     // AND-combined
  actions: Action[];
  enabled: boolean;
}

// Output: what the Shortcut should do
interface ActionPlan {
  activityId: string;
  actions: PlannedAction[];
}

// Single entry point
function evaluateAndPlan(activity: Activity, rules: Rule[]): ActionPlan;
```

The Shortcut serializes the activity as JSON, calls the engine, and parses the returned `ActionPlan` as JSON. The entire exchange is stateless and idempotent.
