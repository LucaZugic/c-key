import { describe, it, expect } from "vitest";
import { evaluateRule, evaluateRules } from "../../src/domain/rules";
import { meters, seconds } from "../../src/domain/values";
import type { Activity, Rule } from "../../src/domain/types";

// ============================================================================
// Test Helpers
// ============================================================================

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "test-activity-1",
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
// evaluateRule - Single Rule Evaluation
// ============================================================================

describe("evaluateRule", () => {
  describe("with empty filters", () => {
    it("returns true when rule has no filters (matches all activities)", () => {
      const rule = createRule({ filters: [] });
      const activity = createActivity();
      expect(evaluateRule(rule, activity)).toBe(true);
    });
  });

  describe("with single filter", () => {
    it("returns true when filter matches", () => {
      const rule = createRule({
        filters: [{ type: "SportEquals", sport: "Run" }],
      });
      const activity = createActivity({ sportType: "Run" });
      expect(evaluateRule(rule, activity)).toBe(true);
    });

    it("returns false when filter does not match", () => {
      const rule = createRule({
        filters: [{ type: "SportEquals", sport: "Ride" }],
      });
      const activity = createActivity({ sportType: "Run" });
      expect(evaluateRule(rule, activity)).toBe(false);
    });
  });

  describe("with multiple filters (AND logic)", () => {
    it("returns true when all filters match", () => {
      const rule = createRule({
        filters: [
          { type: "SportEquals", sport: "Run" },
          { type: "DistanceGreaterThan", meters: 1000 },
          { type: "GearIsEmpty" },
        ],
      });
      const activity = createActivity({
        sportType: "Run",
        distance: meters(5000),
        gearId: null,
      });
      expect(evaluateRule(rule, activity)).toBe(true);
    });

    it("returns false when first filter does not match", () => {
      const rule = createRule({
        filters: [
          { type: "SportEquals", sport: "Ride" },
          { type: "DistanceGreaterThan", meters: 1000 },
        ],
      });
      const activity = createActivity({
        sportType: "Run",
        distance: meters(5000),
      });
      expect(evaluateRule(rule, activity)).toBe(false);
    });

    it("returns false when second filter does not match", () => {
      const rule = createRule({
        filters: [
          { type: "SportEquals", sport: "Run" },
          { type: "DistanceGreaterThan", meters: 10000 },
        ],
      });
      const activity = createActivity({
        sportType: "Run",
        distance: meters(5000),
      });
      expect(evaluateRule(rule, activity)).toBe(false);
    });

    it("returns false when any filter does not match", () => {
      const rule = createRule({
        filters: [
          { type: "SportEquals", sport: "Run" },
          { type: "DistanceGreaterThan", meters: 1000 },
          { type: "GearEquals", gearId: "g12345" },
        ],
      });
      const activity = createActivity({
        sportType: "Run",
        distance: meters(5000),
        gearId: null,
      });
      expect(evaluateRule(rule, activity)).toBe(false);
    });
  });

  describe("with disabled rules", () => {
    it("returns false when rule is disabled", () => {
      const rule = createRule({
        filters: [{ type: "SportEquals", sport: "Run" }],
        enabled: false,
      });
      const activity = createActivity({ sportType: "Run" });
      expect(evaluateRule(rule, activity)).toBe(false);
    });

    it("returns false for disabled rule even with empty filters", () => {
      const rule = createRule({
        filters: [],
        enabled: false,
      });
      const activity = createActivity();
      expect(evaluateRule(rule, activity)).toBe(false);
    });
  });
});

// ============================================================================
// evaluateRules - Multiple Rules Evaluation
// ============================================================================

describe("evaluateRules", () => {
  it("returns empty array when no rules provided", () => {
    const activity = createActivity();
    expect(evaluateRules([], activity)).toEqual([]);
  });

  it("returns empty array when no rules match", () => {
    const rules = [
      createRule({
        id: "rule-1",
        filters: [{ type: "SportEquals", sport: "Ride" }],
      }),
      createRule({
        id: "rule-2",
        filters: [{ type: "SportEquals", sport: "WeightTraining" }],
      }),
    ];
    const activity = createActivity({ sportType: "Run" });
    expect(evaluateRules(rules, activity)).toEqual([]);
  });

  it("returns matching rules in order", () => {
    const rules = [
      createRule({
        id: "rule-1",
        name: "First Rule",
        order: 1,
        filters: [{ type: "SportEquals", sport: "Run" }],
      }),
      createRule({
        id: "rule-2",
        name: "Second Rule",
        order: 2,
        filters: [{ type: "GearIsEmpty" }],
      }),
    ];
    const activity = createActivity({ sportType: "Run", gearId: null });
    const result = evaluateRules(rules, activity);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("rule-1");
    expect(result[1].id).toBe("rule-2");
  });

  it("excludes non-matching rules", () => {
    const rules = [
      createRule({
        id: "rule-1",
        filters: [{ type: "SportEquals", sport: "Run" }],
      }),
      createRule({
        id: "rule-2",
        filters: [{ type: "SportEquals", sport: "Ride" }],
      }),
      createRule({
        id: "rule-3",
        filters: [{ type: "GearIsEmpty" }],
      }),
    ];
    const activity = createActivity({ sportType: "Run", gearId: null });
    const result = evaluateRules(rules, activity);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["rule-1", "rule-3"]);
  });

  it("excludes disabled rules", () => {
    const rules = [
      createRule({
        id: "rule-1",
        filters: [{ type: "SportEquals", sport: "Run" }],
        enabled: true,
      }),
      createRule({
        id: "rule-2",
        filters: [{ type: "SportEquals", sport: "Run" }],
        enabled: false,
      }),
    ];
    const activity = createActivity({ sportType: "Run" });
    const result = evaluateRules(rules, activity);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rule-1");
  });

  it("respects rule order for sorting", () => {
    const rules = [
      createRule({
        id: "rule-3",
        order: 3,
        filters: [],
      }),
      createRule({
        id: "rule-1",
        order: 1,
        filters: [],
      }),
      createRule({
        id: "rule-2",
        order: 2,
        filters: [],
      }),
    ];
    const activity = createActivity();
    const result = evaluateRules(rules, activity);
    expect(result.map((r) => r.id)).toEqual(["rule-1", "rule-2", "rule-3"]);
  });
});
