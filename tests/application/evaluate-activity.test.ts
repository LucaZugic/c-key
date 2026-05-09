import { describe, it, expect } from "vitest";
import { evaluateActivity } from "../../src/application/evaluate-activity";
import { meters, seconds } from "../../src/domain/values";
import type { Activity, Rule } from "../../src/domain/types";

// ============================================================================
// Test Helpers
// ============================================================================

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-123",
    name: "Morning Run",
    sportType: "Run",
    distance: meters(5000),
    movingTime: seconds(1800),
    startDate: new Date("2024-01-15T08:00:00Z"),
    gearId: null,
    ...overrides,
  };
}

function createRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "rule-1",
    name: "Test Rule",
    filters: [],
    actions: [{ type: "Mute" }],
    enabled: true,
    order: 0,
    ...overrides,
  };
}

// ============================================================================
// evaluateActivity
// ============================================================================

describe("evaluateActivity", () => {
  it("returns action plan for given activity", () => {
    const activity = createActivity({ id: "act-456" });
    const rules: Rule[] = [];
    const result = evaluateActivity(activity, rules);
    expect(result.activityId).toBe("act-456");
  });

  it("returns empty actions when no rules match", () => {
    const activity = createActivity({ sportType: "Run" });
    const rules = [
      createRule({
        filters: [{ type: "SportEquals", sport: "Ride" }],
      }),
    ];
    const result = evaluateActivity(activity, rules);
    expect(result.actions).toEqual([]);
  });

  it("returns actions from matching rules", () => {
    const activity = createActivity({ sportType: "WeightTraining" });
    const rules = [
      createRule({
        id: "mute-strength",
        name: "Mute Strength",
        filters: [{ type: "SportEquals", sport: "WeightTraining" }],
        actions: [{ type: "Mute" }],
      }),
    ];
    const result = evaluateActivity(activity, rules);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]!.action).toEqual({ type: "Mute" });
  });

  describe("v1 rule scenarios", () => {
    const v1Rules: Rule[] = [
      {
        id: "shoe-rule",
        name: "Assign Shoes",
        filters: [
          { type: "SportEquals", sport: "Run" },
          { type: "GearIsEmpty" },
        ],
        actions: [{ type: "SetGear", gearId: "shoe-default", interactive: true }],
        enabled: true,
        order: 1,
      },
      {
        id: "mute-strength",
        name: "Mute Strength Training",
        filters: [{ type: "SportEquals", sport: "WeightTraining" }],
        actions: [{ type: "Mute" }],
        enabled: true,
        order: 2,
      },
      {
        id: "short-run",
        name: "Reclassify Short Runs",
        filters: [
          { type: "SportEquals", sport: "Run" },
          { type: "DistanceLessThan", meters: 1000 },
        ],
        actions: [{ type: "ChangeSportType", sport: "Walk" }],
        enabled: true,
        order: 3,
      },
    ];

    it("assigns shoes for run without gear", () => {
      const activity = createActivity({
        sportType: "Run",
        distance: meters(5000),
        gearId: null,
      });
      const result = evaluateActivity(activity, v1Rules);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]!.sourceRuleName).toBe("Assign Shoes");
      expect(result.actions[0]!.action).toEqual({
        type: "SetGear",
        gearId: "shoe-default",
        interactive: true,
      });
    });

    it("mutes weight training", () => {
      const activity = createActivity({ sportType: "WeightTraining" });
      const result = evaluateActivity(activity, v1Rules);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]!.sourceRuleName).toBe("Mute Strength Training");
      expect(result.actions[0]!.action).toEqual({ type: "Mute" });
    });

    it("reclassifies short run as walk", () => {
      const activity = createActivity({
        sportType: "Run",
        distance: meters(500),
        gearId: "existing-shoe",
      });
      const result = evaluateActivity(activity, v1Rules);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]!.sourceRuleName).toBe("Reclassify Short Runs");
      expect(result.actions[0]!.action).toEqual({
        type: "ChangeSportType",
        sport: "Walk",
      });
    });

    it("applies both shoe assignment and reclassification for short ungeared run", () => {
      const activity = createActivity({
        sportType: "Run",
        distance: meters(500),
        gearId: null,
      });
      const result = evaluateActivity(activity, v1Rules);

      expect(result.actions).toHaveLength(2);
      expect(result.actions[0]!.sourceRuleName).toBe("Assign Shoes");
      expect(result.actions[1]!.sourceRuleName).toBe("Reclassify Short Runs");
    });

    it("skips all rules for ride activity", () => {
      const activity = createActivity({ sportType: "Ride" });
      const result = evaluateActivity(activity, v1Rules);
      expect(result.actions).toEqual([]);
    });

    it("skips shoe rule when gear already assigned", () => {
      const activity = createActivity({
        sportType: "Run",
        distance: meters(5000),
        gearId: "existing-shoe",
      });
      const result = evaluateActivity(activity, v1Rules);
      expect(result.actions).toEqual([]);
    });
  });
});
