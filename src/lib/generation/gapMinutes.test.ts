import { describe, expect, it } from "vitest";
import type { DateRange, DayOfWeek, Section } from "../domain/section";
import type { GenerationConstraints } from "./constraints";
import { activeRules, generateSchedules } from "./engine";
import { gapConstraints, toGapMinutes } from "./gapMinutes";

const FULL_TERM: DateRange = { start: "2026-08-12", end: "2026-12-03" };

function section(
  crn: number,
  abbr: string,
  start: string,
  end: string,
  days: DayOfWeek[] = ["monday"],
): Section {
  return {
    crn,
    courseAbbr: abbr,
    courseNumber: abbr.slice(4),
    courseTitle: abbr,
    creditHours: { min: 3, max: 3 },
    campus: { id: 1, abbr: "ATH", description: "Athens" },
    professor: null,
    seatsAvailable: 10,
    actualEnrollment: 0,
    maximumEnrollment: 10,
    cancelled: false,
    lastSeenAt: new Date(),
    academicPeriod: 202608,
    dateRange: FULL_TERM,
    meetings: [
      { days, startTime: start, endTime: end, building: null, room: null },
    ],
  };
}

const COURSES = [
  {
    courseCode: "CSCI1301",
    sections: [
      section(1, "CSCI1301", "09:00", "09:50"),
      section(2, "CSCI1301", "13:00", "13:50"),
    ],
  },
  {
    courseCode: "MATH2250",
    sections: [
      section(3, "MATH2250", "10:00", "10:50"),
      section(4, "MATH2250", "09:30", "10:20"),
      section(5, "MATH2250", "16:00", "16:50"),
    ],
  },
];

const BASE: GenerationConstraints = {
  excludedCourses: [],
  excludedSections: [],
  minCreditHours: 0,
  maxCreditHours: 0,
  showFilledClasses: true,
};

describe("gap constraint fields: unset means unchanged", () => {
  it("builds the same constraints for a request that names no gap", () => {
    expect(gapConstraints({})).toEqual({});
    expect(Object.keys(gapConstraints({}))).toEqual([]);
    expect({ ...BASE, ...gapConstraints({}) }).toStrictEqual(BASE);
  });

  it("activates the same rules, in the same order", () => {
    const withUnset: GenerationConstraints = {
      ...BASE,
      minGapMinutes: undefined,
      maxGapMinutes: undefined,
    };
    expect(activeRules(withUnset)).toEqual(activeRules(BASE));
  });

  it("generates the same schedules in the same order", () => {
    const before = generateSchedules(COURSES, BASE);
    const after = generateSchedules(COURSES, {
      ...BASE,
      minGapMinutes: undefined,
      maxGapMinutes: undefined,
    });
    expect(before.ok).toBe(true);
    expect(after).toEqual(before);
  });
});

describe("toGapMinutes", () => {
  it("keeps whole minutes from 0 to a day", () => {
    expect(toGapMinutes(0)).toBe(0);
    expect(toGapMinutes(15)).toBe(15);
    expect(toGapMinutes(1440)).toBe(1440);
  });

  it.each([-1, 1.5, 1441, NaN, Infinity, "30", null, undefined, {}])(
    "drops %j, as if it were not set",
    (value) => {
      expect(toGapMinutes(value)).toBeUndefined();
    },
  );
});

describe("gapConstraints", () => {
  it("passes valid bounds through, one or both", () => {
    expect(gapConstraints({ minGapMinutes: 10 })).toEqual({
      minGapMinutes: 10,
    });
    expect(gapConstraints({ maxGapMinutes: 90 })).toEqual({
      maxGapMinutes: 90,
    });
    expect(gapConstraints({ minGapMinutes: 10, maxGapMinutes: 90 })).toEqual({
      minGapMinutes: 10,
      maxGapMinutes: 90,
    });
  });

  it("drops a pair where the minimum is above the maximum", () => {
    expect(gapConstraints({ minGapMinutes: 90, maxGapMinutes: 10 })).toEqual(
      {},
    );
  });
});
