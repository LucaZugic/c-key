/**
 * Entry point for iOS Shortcut.
 * Handles JSON serialization and Strava API format mapping.
 */

import type { Activity, Rule, ActionPlan } from "../domain/types";
import { meters, seconds } from "../domain/values";
import { evaluateActivity } from "../application/evaluate-activity";

/**
 * Strava API activity format (snake_case).
 */
interface StravaActivity {
  id: string;
  name: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  gear_id: string | null;
}

/**
 * Maps Strava API activity to domain Activity.
 */
function mapStravaActivity(strava: StravaActivity): Activity {
  return {
    id: strava.id,
    name: strava.name,
    sportType: strava.sport_type as Activity["sportType"],
    distance: meters(strava.distance),
    movingTime: seconds(strava.moving_time),
    startDate: new Date(strava.start_date),
    gearId: strava.gear_id,
  };
}

/**
 * Main entry point for the iOS Shortcut.
 * Takes activity and rules as JSON strings, returns ActionPlan as JSON string.
 *
 * @param activityJson - Strava activity in JSON format (snake_case)
 * @param rulesJson - Array of rules in JSON format
 * @returns ActionPlan in JSON format
 */
export function evaluateAndPlan(activityJson: string, rulesJson: string): string {
  const stravaActivity = JSON.parse(activityJson) as StravaActivity;
  const rules = JSON.parse(rulesJson) as Rule[];

  const activity = mapStravaActivity(stravaActivity);
  const actionPlan = evaluateActivity(activity, rules);

  return JSON.stringify(actionPlan);
}
