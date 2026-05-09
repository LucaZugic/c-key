/**
 * Core domain types for c-key rules engine.
 * These types are pure data structures with no external dependencies.
 */

// ============================================================================
// Branded Types (prevent primitive obsession)
// ============================================================================

export type MetersDistance = {
  readonly _brand: "meters";
  readonly value: number;
};

export type SecondsTime = {
  readonly _brand: "seconds";
  readonly value: number;
};

// ============================================================================
// Sport Types
// ============================================================================

export type Sport =
  | "Run"
  | "Ride"
  | "WeightTraining"
  | "Workout"
  | "Walk"
  | "Hike"
  | "VirtualRide"
  | "VirtualRun";

// ============================================================================
// Activity (Aggregate Root)
// ============================================================================

export interface Activity {
  readonly id: string;
  readonly name: string;
  readonly sportType: Sport;
  readonly distance: MetersDistance;
  readonly movingTime: SecondsTime;
  readonly startDate: Date;
  readonly gearId: string | null;
}

// ============================================================================
// Gear (Value Object)
// ============================================================================

export interface Gear {
  readonly id: string;
  readonly name: string;
}

// ============================================================================
// Filters (Discriminated Union)
// ============================================================================

export type Filter =
  | { readonly type: "SportEquals"; readonly sport: Sport }
  | { readonly type: "DistanceLessThan"; readonly meters: number }
  | { readonly type: "DistanceGreaterThan"; readonly meters: number }
  | { readonly type: "DistanceBetween"; readonly minMeters: number; readonly maxMeters: number }
  | { readonly type: "MovingTimeLessThan"; readonly seconds: number }
  | { readonly type: "MovingTimeGreaterThan"; readonly seconds: number }
  | { readonly type: "NameContains"; readonly substring: string }
  | { readonly type: "GearEquals"; readonly gearId: string }
  | { readonly type: "GearIsEmpty" }
  | { readonly type: "TimeOfDayBetween"; readonly startHour: number; readonly endHour: number };

// ============================================================================
// Actions (Discriminated Union)
// ============================================================================

export type Action =
  | { readonly type: "SetGear"; readonly gearId: string; readonly interactive: boolean }
  | { readonly type: "Mute" }
  | { readonly type: "ChangeSportType"; readonly sport: Sport }
  | { readonly type: "PrependToName"; readonly prefix: string }
  | { readonly type: "AppendToName"; readonly suffix: string }
  | { readonly type: "SetCommute"; readonly value: boolean }
  | { readonly type: "SetTrainer"; readonly value: boolean };

// ============================================================================
// Rule (Entity)
// ============================================================================

export interface Rule {
  readonly id: string;
  readonly name: string;
  readonly filters: readonly Filter[];
  readonly actions: readonly Action[];
  readonly enabled: boolean;
  readonly order: number;
}

// ============================================================================
// Action Plan (Value Object)
// ============================================================================

export interface PlannedAction {
  readonly action: Action;
  readonly sourceRuleId: string;
  readonly sourceRuleName: string;
}

export interface ActionPlan {
  readonly activityId: string;
  readonly actions: readonly PlannedAction[];
}
