/**
 * Action planning logic.
 * Creates an execution plan by evaluating rules against an activity.
 */

import type { Activity, ActionPlan, PlannedAction, Rule } from "./types";
import { evaluateRules } from "./rules";

/**
 * Creates an action plan for an activity based on matching rules.
 * Actions are collected from all matching rules in rule order.
 */
export function createActionPlan(rules: readonly Rule[], activity: Activity): ActionPlan {
  const matchingRules = evaluateRules(rules, activity);

  const actions: PlannedAction[] = matchingRules.flatMap((rule) =>
    rule.actions.map((action) => ({
      action,
      sourceRuleId: rule.id,
      sourceRuleName: rule.name,
    }))
  );

  return {
    activityId: activity.id,
    actions,
  };
}
