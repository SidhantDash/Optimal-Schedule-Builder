import { describe, expect, it } from "vitest";
import { PLAN_CRNS_MAX, PLAN_NAME_MAX, planFileSchema } from "./schema";

const GOOD = {
  version: 1 as const,
  term: 202608,
  name: "Plan 1",
  crns: [12345, 23456],
  pinned: false,
};

const check = (value: unknown) => planFileSchema.safeParse(value).success;

describe("the .dogdays.json schema", () => {
  it("accepts a plan", () => {
    expect(planFileSchema.parse(GOOD)).toEqual(GOOD);
  });

  it("trims the name", () => {
    expect(planFileSchema.parse({ ...GOOD, name: "  Fall  " }).name).toBe(
      "Fall",
    );
  });

  it.each([
    ["a different version", { ...GOOD, version: 2 }],
    ["a missing key", { ...GOOD, pinned: undefined }],
    ["an unknown key", { ...GOOD, extra: true }],
    ["a string term", { ...GOOD, term: "202608" }],
    ["a term that is not a registrar term", { ...GOOD, term: 202607 }],
    ["a blank name", { ...GOOD, name: "   " }],
    [
      "a name that is too long",
      { ...GOOD, name: "x".repeat(PLAN_NAME_MAX + 1) },
    ],
    ["no CRNs", { ...GOOD, crns: [] }],
    [
      "too many CRNs",
      {
        ...GOOD,
        crns: Array.from({ length: PLAN_CRNS_MAX + 1 }, (_, i) => i + 1),
      },
    ],
    ["a repeated CRN", { ...GOOD, crns: [1, 1] }],
    ["a fractional CRN", { ...GOOD, crns: [1.5] }],
    ["a CRN beyond int4", { ...GOOD, crns: [2_147_483_648] }],
    ["a zero CRN", { ...GOOD, crns: [0] }],
    ["a non-boolean pinned", { ...GOOD, pinned: "yes" }],
    ["an array", [1, 2]],
    ["null", null],
  ])("refuses %s", (_label, value) => {
    expect(check(value)).toBe(false);
  });
});
