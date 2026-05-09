"use strict";
var CKey = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/entry/shortcut.ts
  var shortcut_exports = {};
  __export(shortcut_exports, {
    evaluateAndPlan: () => evaluateAndPlan
  });

  // src/domain/values.ts
  function meters(value) {
    return { _brand: "meters", value };
  }
  function seconds(value) {
    return { _brand: "seconds", value };
  }

  // src/domain/filters.ts
  function evaluateFilter(filter, activity) {
    switch (filter.type) {
      case "DistanceLessThan":
        return activity.distance.value < filter.meters;
      case "DistanceGreaterThan":
        return activity.distance.value > filter.meters;
      case "DistanceBetween":
        return activity.distance.value >= filter.minMeters && activity.distance.value <= filter.maxMeters;
      case "SportEquals":
        return activity.sportType === filter.sport;
      case "MovingTimeLessThan":
        return activity.movingTime.value < filter.seconds;
      case "MovingTimeGreaterThan":
        return activity.movingTime.value > filter.seconds;
      case "NameContains":
        return activity.name.toLowerCase().includes(filter.substring.toLowerCase());
      case "GearEquals":
        return activity.gearId === filter.gearId;
      case "GearIsEmpty":
        return activity.gearId === null;
      case "TimeOfDayBetween": {
        const hour = activity.startDate.getUTCHours();
        return hour >= filter.startHour && hour < filter.endHour;
      }
    }
  }

  // src/domain/rules.ts
  function evaluateRule(rule, activity) {
    if (!rule.enabled) {
      return false;
    }
    return rule.filters.every((filter) => evaluateFilter(filter, activity));
  }
  function evaluateRules(rules, activity) {
    return rules.filter((rule) => evaluateRule(rule, activity)).sort((a, b) => a.order - b.order);
  }

  // src/domain/actions.ts
  function createActionPlan(rules, activity) {
    const matchingRules = evaluateRules(rules, activity);
    const actions = matchingRules.flatMap(
      (rule) => rule.actions.map((action) => ({
        action,
        sourceRuleId: rule.id,
        sourceRuleName: rule.name
      }))
    );
    return {
      activityId: activity.id,
      actions
    };
  }

  // src/application/evaluate-activity.ts
  function evaluateActivity(activity, rules) {
    return createActionPlan(rules, activity);
  }

  // src/entry/shortcut.ts
  function mapStravaActivity(strava) {
    return {
      id: strava.id,
      name: strava.name,
      sportType: strava.sport_type,
      distance: meters(strava.distance),
      movingTime: seconds(strava.moving_time),
      startDate: new Date(strava.start_date),
      gearId: strava.gear_id
    };
  }
  function evaluateAndPlan(activityJson, rulesJson) {
    const stravaActivity = JSON.parse(activityJson);
    const rules = JSON.parse(rulesJson);
    const activity = mapStravaActivity(stravaActivity);
    const actionPlan = evaluateActivity(activity, rules);
    return JSON.stringify(actionPlan);
  }
  return __toCommonJS(shortcut_exports);
})();
