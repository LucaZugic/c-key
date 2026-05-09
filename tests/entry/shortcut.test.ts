import { describe, it, expect } from "vitest";
import { evaluateAndPlan } from "../../src/entry/shortcut";

// ============================================================================
// evaluateAndPlan - Entry Point
// ============================================================================

describe("evaluateAndPlan", () => {
  describe("basic functionality", () => {
    it("returns JSON string", () => {
      const activityJson = JSON.stringify({
        id: "123",
        name: "Test",
        sport_type: "Run",
        distance: 5000,
        moving_time: 1800,
        start_date: "2024-01-15T08:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify([]);

      const result = evaluateAndPlan(activityJson, rulesJson);

      expect(typeof result).toBe("string");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("returns action plan with activity id", () => {
      const activityJson = JSON.stringify({
        id: "activity-789",
        name: "Morning Run",
        sport_type: "Run",
        distance: 5000,
        moving_time: 1800,
        start_date: "2024-01-15T08:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify([]);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.activityId).toBe("activity-789");
    });
  });

  describe("Strava snake_case mapping", () => {
    it("maps sport_type to sportType", () => {
      const activityJson = JSON.stringify({
        id: "123",
        name: "Ride",
        sport_type: "Ride",
        distance: 10000,
        moving_time: 3600,
        start_date: "2024-01-15T08:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify([
        {
          id: "ride-rule",
          name: "Ride Rule",
          filters: [{ type: "SportEquals", sport: "Ride" }],
          actions: [{ type: "Mute" }],
          enabled: true,
          order: 1,
        },
      ]);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toHaveLength(1);
    });

    it("maps gear_id to gearId", () => {
      const activityJson = JSON.stringify({
        id: "123",
        name: "Run",
        sport_type: "Run",
        distance: 5000,
        moving_time: 1800,
        start_date: "2024-01-15T08:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify([
        {
          id: "gear-rule",
          name: "No Gear Rule",
          filters: [{ type: "GearIsEmpty" }],
          actions: [{ type: "SetGear", gearId: "g123", interactive: false }],
          enabled: true,
          order: 1,
        },
      ]);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toHaveLength(1);
    });

    it("maps distance in meters correctly", () => {
      const activityJson = JSON.stringify({
        id: "123",
        name: "Short Run",
        sport_type: "Run",
        distance: 500,
        moving_time: 300,
        start_date: "2024-01-15T08:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify([
        {
          id: "short-rule",
          name: "Short Distance",
          filters: [{ type: "DistanceLessThan", meters: 1000 }],
          actions: [{ type: "ChangeSportType", sport: "Walk" }],
          enabled: true,
          order: 1,
        },
      ]);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toHaveLength(1);
    });

    it("maps moving_time in seconds correctly", () => {
      const activityJson = JSON.stringify({
        id: "123",
        name: "Quick Run",
        sport_type: "Run",
        distance: 1000,
        moving_time: 300,
        start_date: "2024-01-15T08:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify([
        {
          id: "quick-rule",
          name: "Quick Activity",
          filters: [{ type: "MovingTimeLessThan", seconds: 600 }],
          actions: [{ type: "Mute" }],
          enabled: true,
          order: 1,
        },
      ]);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toHaveLength(1);
    });

    it("parses start_date as Date for time filters", () => {
      const activityJson = JSON.stringify({
        id: "123",
        name: "Morning Run",
        sport_type: "Run",
        distance: 5000,
        moving_time: 1800,
        start_date: "2024-01-15T08:30:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify([
        {
          id: "morning-rule",
          name: "Morning Activity",
          filters: [{ type: "TimeOfDayBetween", startHour: 6, endHour: 12 }],
          actions: [{ type: "PrependToName", prefix: "[AM] " }],
          enabled: true,
          order: 1,
        },
      ]);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toHaveLength(1);
    });
  });

  describe("v1 end-to-end scenarios", () => {
    const v1Rules = [
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

    it("processes running activity without gear", () => {
      const activityJson = JSON.stringify({
        id: "strava-activity-1",
        name: "Evening Run",
        sport_type: "Run",
        distance: 8000,
        moving_time: 2400,
        start_date: "2024-01-15T18:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify(v1Rules);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.activityId).toBe("strava-activity-1");
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]).toEqual({
        action: { type: "SetGear", gearId: "shoe-default", interactive: true },
        sourceRuleId: "shoe-rule",
        sourceRuleName: "Assign Shoes",
      });
    });

    it("processes weight training activity", () => {
      const activityJson = JSON.stringify({
        id: "strava-activity-2",
        name: "Gym Session",
        sport_type: "WeightTraining",
        distance: 0,
        moving_time: 3600,
        start_date: "2024-01-15T07:00:00Z",
        gear_id: null,
      });
      const rulesJson = JSON.stringify(v1Rules);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].action).toEqual({ type: "Mute" });
    });

    it("processes short run with gear already assigned", () => {
      const activityJson = JSON.stringify({
        id: "strava-activity-3",
        name: "Quick Warmup",
        sport_type: "Run",
        distance: 400,
        moving_time: 180,
        start_date: "2024-01-15T06:00:00Z",
        gear_id: "existing-shoe-id",
      });
      const rulesJson = JSON.stringify(v1Rules);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].action).toEqual({
        type: "ChangeSportType",
        sport: "Walk",
      });
    });

    it("returns empty actions for cycling activity", () => {
      const activityJson = JSON.stringify({
        id: "strava-activity-4",
        name: "Commute",
        sport_type: "Ride",
        distance: 15000,
        moving_time: 2700,
        start_date: "2024-01-15T08:30:00Z",
        gear_id: "bike-id",
      });
      const rulesJson = JSON.stringify(v1Rules);

      const result = JSON.parse(evaluateAndPlan(activityJson, rulesJson));

      expect(result.actions).toEqual([]);
    });
  });
});
