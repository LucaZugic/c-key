/**
 * Filter evaluation logic.
 * Each filter type tests a specific condition against an activity.
 */

import type { Activity, Filter } from "./types";

export function evaluateFilter(filter: Filter, activity: Activity): boolean {
  switch (filter.type) {
    case "DistanceLessThan":
      return activity.distance.value < filter.meters;

    case "DistanceGreaterThan":
      return activity.distance.value > filter.meters;

    case "DistanceBetween":
      return (
        activity.distance.value >= filter.minMeters &&
        activity.distance.value <= filter.maxMeters
      );

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
