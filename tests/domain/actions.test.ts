import { describe, it, expect } from "vitest";
import { createActionPlan } from "../../src/domain/actions";
import { meters, seconds } from "../../src/domain/values";
import type { Activity, Rule, ActionPlan } from "../../src/domain/types";

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
// createActionPlan
// ============================================================================

describe("createActionPlan", () => {
  describe("basic functionality", () => {
    it("returns action plan with activity id", () => {
      const activity = createActivity({ id: "activity-456" });
      const rules: Rule[] = [];
      const plan = createActionPlan(rules, activity);
      expect(plan.activityId).toBe("activity-456");
    });

    it("returns empty actions when no rules provided", () => {
      const activity = createActivity();
      const plan = createActionPlan([], activity);
      expect(plan.actions).toEqual([]);
    });

    it("returns empty actions when no rules match", () => {
      const rules = [
        createRule({
          filters: [{ type: "SportEquals", sport: "Ride" }],
          actions: [{ type: "Mute" }],
        }),
      ];
      const activity = createActivity({ sportType: "Run" });
      const plan = createActionPlan(rules, activity);
      expect(plan.actions).toEqual([]);
    });
  });

  describe("single matching rule", () => {
    it("includes actions from matching rule", () => {
      const rules = [
        createRule({
          id: "rule-1",
          name: "Mute Runs",
          filters: [{ type: "SportEquals", sport: "Run" }],
          actions: [{ type: "Mute" }],
        }),
      ];
      const activity = createActivity({ sportType: "Run" });
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0]).toEqual({
        action: { type: "Mute" },
        sourceRuleId: "rule-1",
        sourceRuleName: "Mute Runs",
      });
    });

    it("includes multiple actions from single rule", () => {
      const rules = [
        createRule({
          id: "rule-1",
          name: "Update Run",
          filters: [{ type: "SportEquals", sport: "Run" }],
          actions: [
            { type: "SetGear", gearId: "g123", interactive: false },
            { type: "PrependToName", prefix: "[Auto] " },
          ],
        }),
      ];
      const activity = createActivity({ sportType: "Run" });
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(2);
      expect(plan.actions[0].action).toEqual({
        type: "SetGear",
        gearId: "g123",
        interactive: false,
      });
      expect(plan.actions[1].action).toEqual({
        type: "PrependToName",
        prefix: "[Auto] ",
      });
    });
  });

  describe("multiple matching rules", () => {
    it("collects actions from all matching rules in order", () => {
      const rules = [
        createRule({
          id: "rule-1",
          name: "First Rule",
          order: 1,
          filters: [{ type: "SportEquals", sport: "Run" }],
          actions: [{ type: "Mute" }],
        }),
        createRule({
          id: "rule-2",
          name: "Second Rule",
          order: 2,
          filters: [{ type: "GearIsEmpty" }],
          actions: [{ type: "SetGear", gearId: "g123", interactive: true }],
        }),
      ];
      const activity = createActivity({ sportType: "Run", gearId: null });
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(2);
      expect(plan.actions[0].sourceRuleId).toBe("rule-1");
      expect(plan.actions[1].sourceRuleId).toBe("rule-2");
    });

    it("respects rule order regardless of input order", () => {
      const rules = [
        createRule({
          id: "rule-2",
          name: "Second",
          order: 2,
          filters: [],
          actions: [{ type: "Mute" }],
        }),
        createRule({
          id: "rule-1",
          name: "First",
          order: 1,
          filters: [],
          actions: [{ type: "SetCommute", value: true }],
        }),
      ];
      const activity = createActivity();
      const plan = createActionPlan(rules, activity);

      expect(plan.actions[0].sourceRuleId).toBe("rule-1");
      expect(plan.actions[1].sourceRuleId).toBe("rule-2");
    });

    it("excludes actions from non-matching rules", () => {
      const rules = [
        createRule({
          id: "rule-1",
          filters: [{ type: "SportEquals", sport: "Run" }],
          actions: [{ type: "Mute" }],
        }),
        createRule({
          id: "rule-2",
          filters: [{ type: "SportEquals", sport: "Ride" }],
          actions: [{ type: "SetCommute", value: true }],
        }),
      ];
      const activity = createActivity({ sportType: "Run" });
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0].sourceRuleId).toBe("rule-1");
    });

    it("excludes actions from disabled rules", () => {
      const rules = [
        createRule({
          id: "rule-1",
          enabled: true,
          filters: [],
          actions: [{ type: "Mute" }],
        }),
        createRule({
          id: "rule-2",
          enabled: false,
          filters: [],
          actions: [{ type: "SetCommute", value: true }],
        }),
      ];
      const activity = createActivity();
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0].sourceRuleId).toBe("rule-1");
    });
  });

  describe("v1 rule scenarios", () => {
    it("handles shoe assignment by distance rule", () => {
      const rules = [
        createRule({
          id: "shoe-rule",
          name: "Assign Running Shoes",
          filters: [
            { type: "SportEquals", sport: "Run" },
            { type: "GearIsEmpty" },
          ],
          actions: [{ type: "SetGear", gearId: "shoe-123", interactive: true }],
        }),
      ];
      const activity = createActivity({
        sportType: "Run",
        distance: meters(8000),
        gearId: null,
      });
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0].action).toEqual({
        type: "SetGear",
        gearId: "shoe-123",
        interactive: true,
      });
    });

    it("handles mute strength training rule", () => {
      const rules = [
        createRule({
          id: "mute-strength",
          name: "Mute Strength Training",
          filters: [{ type: "SportEquals", sport: "WeightTraining" }],
          actions: [{ type: "Mute" }],
        }),
      ];
      const activity = createActivity({ sportType: "WeightTraining" });
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0].action).toEqual({ type: "Mute" });
    });

    it("handles reclassify short runs rule", () => {
      const rules = [
        createRule({
          id: "short-run",
          name: "Reclassify Short Runs",
          filters: [
            { type: "SportEquals", sport: "Run" },
            { type: "DistanceLessThan", meters: 1000 },
          ],
          actions: [{ type: "ChangeSportType", sport: "Walk" }],
        }),
      ];
      const activity = createActivity({
        sportType: "Run",
        distance: meters(500),
      });
      const plan = createActionPlan(rules, activity);

      expect(plan.actions).toHaveLength(1);
      expect(plan.actions[0].action).toEqual({
        type: "ChangeSportType",
        sport: "Walk",
      });
    });
  });
});
