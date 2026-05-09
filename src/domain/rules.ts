/**
 * Rule evaluation logic.
 * Evaluates rules against activities using AND logic for filters.
 */

import type { Activity, Rule } from "./types";
import { evaluateFilter } from "./filters";

/**
 * Evaluates a single rule against an activity.
 * Returns true if the rule is enabled and all filters match (AND logic).
 * A rule with no filters matches all activities.
 */
export function evaluateRule(rule: Rule, activity: Activity): boolean {
  if (!rule.enabled) {
    return false;
  }

  return rule.filters.every((filter) => evaluateFilter(filter, activity));
}

/**
 * Evaluates multiple rules against an activity.
 * Returns matching rules sorted by their order property.
 */
export function evaluateRules(rules: readonly Rule[], activity: Activity): Rule[] {
  return rules
    .filter((rule) => evaluateRule(rule, activity))
    .sort((a, b) => a.order - b.order);
}
