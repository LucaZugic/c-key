import { describe, it, expect } from "vitest";
import { evaluateFilter } from "../../src/domain/filters";
import { meters, seconds } from "../../src/domain/values";
import type { Activity, Filter, Sport } from "../../src/domain/types";

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

// ============================================================================
// DistanceLessThan Filter
// ============================================================================

describe("DistanceLessThan filter", () => {
  const filter: Filter = { type: "DistanceLessThan", meters: 2000 };

  it("returns true when activity distance is below the threshold", () => {
    const activity = createActivity({ distance: meters(1500) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when activity distance equals the threshold", () => {
    const activity = createActivity({ distance: meters(2000) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when activity distance exceeds the threshold", () => {
    const activity = createActivity({ distance: meters(2500) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns true for zero distance", () => {
    const activity = createActivity({ distance: meters(0) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });
});

// ============================================================================
// DistanceGreaterThan Filter
// ============================================================================

describe("DistanceGreaterThan filter", () => {
  const filter: Filter = { type: "DistanceGreaterThan", meters: 10000 };

  it("returns true when activity distance exceeds the threshold", () => {
    const activity = createActivity({ distance: meters(15000) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when activity distance equals the threshold", () => {
    const activity = createActivity({ distance: meters(10000) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when activity distance is below the threshold", () => {
    const activity = createActivity({ distance: meters(5000) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });
});

// ============================================================================
// DistanceBetween Filter
// ============================================================================

describe("DistanceBetween filter", () => {
  const filter: Filter = { type: "DistanceBetween", minMeters: 5000, maxMeters: 10000 };

  it("returns true when activity distance is within range", () => {
    const activity = createActivity({ distance: meters(7500) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns true when activity distance equals minimum", () => {
    const activity = createActivity({ distance: meters(5000) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns true when activity distance equals maximum", () => {
    const activity = createActivity({ distance: meters(10000) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when activity distance is below minimum", () => {
    const activity = createActivity({ distance: meters(4999) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when activity distance exceeds maximum", () => {
    const activity = createActivity({ distance: meters(10001) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });
});

// ============================================================================
// SportEquals Filter
// ============================================================================

describe("SportEquals filter", () => {
  it("returns true when sport type matches", () => {
    const filter: Filter = { type: "SportEquals", sport: "Run" };
    const activity = createActivity({ sportType: "Run" });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when sport type does not match", () => {
    const filter: Filter = { type: "SportEquals", sport: "Ride" };
    const activity = createActivity({ sportType: "Run" });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("matches WeightTraining sport type", () => {
    const filter: Filter = { type: "SportEquals", sport: "WeightTraining" };
    const activity = createActivity({ sportType: "WeightTraining" });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });
});

// ============================================================================
// MovingTimeLessThan Filter
// ============================================================================

describe("MovingTimeLessThan filter", () => {
  const filter: Filter = { type: "MovingTimeLessThan", seconds: 600 };

  it("returns true when moving time is below threshold", () => {
    const activity = createActivity({ movingTime: seconds(300) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when moving time equals threshold", () => {
    const activity = createActivity({ movingTime: seconds(600) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when moving time exceeds threshold", () => {
    const activity = createActivity({ movingTime: seconds(900) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });
});

// ============================================================================
// MovingTimeGreaterThan Filter
// ============================================================================

describe("MovingTimeGreaterThan filter", () => {
  const filter: Filter = { type: "MovingTimeGreaterThan", seconds: 3600 };

  it("returns true when moving time exceeds threshold", () => {
    const activity = createActivity({ movingTime: seconds(4000) });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when moving time equals threshold", () => {
    const activity = createActivity({ movingTime: seconds(3600) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when moving time is below threshold", () => {
    const activity = createActivity({ movingTime: seconds(1800) });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });
});

// ============================================================================
// NameContains Filter
// ============================================================================

describe("NameContains filter", () => {
  it("returns true when name contains substring", () => {
    const filter: Filter = { type: "NameContains", substring: "Morning" };
    const activity = createActivity({ name: "Morning Run" });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when name does not contain substring", () => {
    const filter: Filter = { type: "NameContains", substring: "Evening" };
    const activity = createActivity({ name: "Morning Run" });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("is case insensitive", () => {
    const filter: Filter = { type: "NameContains", substring: "morning" };
    const activity = createActivity({ name: "Morning Run" });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("matches partial words", () => {
    const filter: Filter = { type: "NameContains", substring: "Run" };
    const activity = createActivity({ name: "Running Session" });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });
});

// ============================================================================
// GearEquals Filter
// ============================================================================

describe("GearEquals filter", () => {
  it("returns true when gear matches", () => {
    const filter: Filter = { type: "GearEquals", gearId: "g12345" };
    const activity = createActivity({ gearId: "g12345" });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when gear does not match", () => {
    const filter: Filter = { type: "GearEquals", gearId: "g12345" };
    const activity = createActivity({ gearId: "g67890" });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when activity has no gear", () => {
    const filter: Filter = { type: "GearEquals", gearId: "g12345" };
    const activity = createActivity({ gearId: null });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });
});

// ============================================================================
// GearIsEmpty Filter
// ============================================================================

describe("GearIsEmpty filter", () => {
  const filter: Filter = { type: "GearIsEmpty" };

  it("returns true when activity has no gear", () => {
    const activity = createActivity({ gearId: null });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when activity has gear assigned", () => {
    const activity = createActivity({ gearId: "g12345" });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });
});

// ============================================================================
// TimeOfDayBetween Filter
// ============================================================================

describe("TimeOfDayBetween filter", () => {
  const filter: Filter = { type: "TimeOfDayBetween", startHour: 6, endHour: 12 };

  it("returns true when start time is within range", () => {
    const activity = createActivity({
      startDate: new Date("2024-01-15T08:30:00Z"), // 8:30 UTC
    });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns true when start time equals start hour", () => {
    const activity = createActivity({
      startDate: new Date("2024-01-15T06:00:00Z"), // 6:00 UTC
    });
    expect(evaluateFilter(filter, activity)).toBe(true);
  });

  it("returns false when start time equals end hour", () => {
    const activity = createActivity({
      startDate: new Date("2024-01-15T12:00:00Z"), // 12:00 UTC
    });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when start time is before range", () => {
    const activity = createActivity({
      startDate: new Date("2024-01-15T05:00:00Z"), // 5:00 UTC
    });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });

  it("returns false when start time is after range", () => {
    const activity = createActivity({
      startDate: new Date("2024-01-15T18:00:00Z"), // 18:00 UTC
    });
    expect(evaluateFilter(filter, activity)).toBe(false);
  });
});
