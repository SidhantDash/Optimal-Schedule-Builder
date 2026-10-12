import { describe, expect, it } from "vitest";
import {
  PLAN_CRNS_MAX,
  PLAN_FILE_MAX_BYTES,
  PLAN_NAME_MAX,
  parsePlanFile,
  planFileSchema,
  serializePlanFile,
} from "./schema";

const GOOD = {
  version: 1 as const,
  term: 202608,
  name: "Plan 1",
  crns: [12345, 23456],
  pinned: false,
};

const parse = (value: unknown) => parsePlanFile(JSON.stringify(value));

describe("the .dogdays.json schema", () => {
  it("accepts a plan", () => {
    expect(parse(GOOD)).toEqual({ ok: true, plan: GOOD });
  });

  it("round-trips through the serializer", () => {
    const text = serializePlanFile(GOOD);
    expect(text).toBe(
      '{\n  "version": 1,\n  "term": 202608,\n  "name": "Plan 1",\n  "crns": [\n    12345,\n    23456\n  ],\n  "pinned": false\n}\n',
    );
    expect(parsePlanFile(text)).toEqual({ ok: true, plan: GOOD });
  });

  it("trims the name", () => {
    expect(planFileSchema.parse({ ...GOOD, name: "  Fall  " }).name).toBe(
      "Fall",
    );
  });

  it.each([
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
  ])("refuses %s", (_label, value) => {
    expect(parse(value).ok).toBe(false);
  });

  it("says when it is a different version", () => {
    expect(parse({ ...GOOD, version: 2 })).toEqual({
      ok: false,
      error: "This plan was made by a different version of DogDays.",
    });
  });

  it("refuses text that is not JSON, and a JSON value that is not an object", () => {
    expect(parsePlanFile("not json")).toEqual({
      ok: false,
      error: "This file is not valid JSON.",
    });
    expect(parse([1, 2]).ok).toBe(false);
    expect(parse(null).ok).toBe(false);
  });

  it("refuses an oversized file before parsing it", () => {
    const result = parsePlanFile(" ".repeat(PLAN_FILE_MAX_BYTES + 1));
    expect(result).toEqual({
      ok: false,
      error: "This file is too large to be a DogDays plan.",
    });
  });

  it("names the field it refused", () => {
    const result = parse({ ...GOOD, term: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("(term)");
  });
});
