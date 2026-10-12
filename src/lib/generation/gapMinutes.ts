/** A day has 1440 minutes; no gap between two classes in it can be longer. */
const MAX_GAP_MINUTES = 24 * 60;

/**
 * Server actions are public endpoints, so a gap bound from the client is
 * checked, not trusted. Anything that is not a whole number of minutes from 0
 * to 1440 is dropped, which is the same as the bound not being set.
 */
export function toGapMinutes(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_GAP_MINUTES
    ? value
    : undefined;
}

/**
 * The two gap bounds as constraint fields. Unset bounds are left OUT of the
 * object rather than set to `undefined`, so a request that names neither
 * builds exactly the constraints it built before the fields existed. A pair
 * that contradicts itself (min above max) can match nothing, so it is dropped
 * whole rather than silently producing no schedules.
 */
export function gapConstraints(input: {
  minGapMinutes?: unknown;
  maxGapMinutes?: unknown;
}): { minGapMinutes?: number; maxGapMinutes?: number } {
  const min = toGapMinutes(input.minGapMinutes);
  const max = toGapMinutes(input.maxGapMinutes);
  if (min !== undefined && max !== undefined && min > max) return {};
  return {
    ...(min !== undefined ? { minGapMinutes: min } : {}),
    ...(max !== undefined ? { maxGapMinutes: max } : {}),
  };
}
