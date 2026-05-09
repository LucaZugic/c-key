/**
 * Value object constructors for branded types.
 * These functions create type-safe wrappers around primitive values.
 */

import type { MetersDistance, SecondsTime } from "./types";

export function meters(value: number): MetersDistance {
  return { _brand: "meters", value };
}

export function seconds(value: number): SecondsTime {
  return { _brand: "seconds", value };
}
