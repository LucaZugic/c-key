/**
 * EvaluateActivity use case.
 * Orchestrates rule evaluation for an activity.
 */

import type { Activity, ActionPlan, Rule } from "../domain/types";
import { createActionPlan } from "../domain/actions";

/**
 * Evaluates rules against an activity and returns an action plan.
 * This is the primary use case for the rules engine.
 */
export function evaluateActivity(activity: Activity, rules: readonly Rule[]): ActionPlan {
  return createActionPlan(rules, activity);
}
