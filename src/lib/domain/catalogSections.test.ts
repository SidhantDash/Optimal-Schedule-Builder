import type { Section as CatalogSection } from "@devdogsuga/sdk/catalog";
import { describe, expect, it, vi } from "vitest";
import {
  loadSections,
  SECTIONS_PER_REQUEST,
  toDomainSection,
} from "./catalogSections";

function catalogSection(
  overrides: Partial<CatalogSection> = {},
): CatalogSection {
  return {
    crn: 12345,
    courseId: 9,
    courseAbbr: "CSCI1301",
    courseNumber: "1301",
    courseTitle: "Intro to Computing",
    creditHours: { min: 4, max: 4 },
    campus: { id: 1, abbr: "ATH", description: "Athens" },
    professor: { name: "Ada Lovelace" },
    seatsAvailable: 10,
    actualEnrollment: 20,
    maximumEnrollment: 30,
    cancelled: false,
    lastSeenAt: "2026-10-12T03:04:05.000Z",
    academicPeriod: 202608,
    dateRange: { start: "2026-08-12", end: "2026-12-03" },
    meetings: [
      {
        days: ["monday", "wednesday"],
        startDate: null,
        endDate: null,
        startTime: "09:00:00",
        endTime: "09:50:00",
        building: {
          code: "24",
          description: "Boyd",
          address: null,
          lat: 33.9,
          lon: -83.3,
        },
        room: "101",
        locationStatus: "RESERVED",
      },
    ],
    ...overrides,
  };
}

describe("toDomainSection", () => {
  it("keeps the fields the generator reads and parses the last-seen time", () => {
    const section = toDomainSection(catalogSection());
    expect(section.crn).toBe(12345);
    expect(section.lastSeenAt).toEqual(new Date("2026-10-12T03:04:05.000Z"));
    expect(section.meetings).toEqual([
      {
        days: ["monday", "wednesday"],
        startTime: "09:00:00",
        endTime: "09:50:00",
        room: "101",
        building: {
          code: "24",
          description: "Boyd",
          address: null,
          lat: 33.9,
          lon: -83.3,
        },
      },
    ]);
  });

  it("keeps a cancelled section: usability is a downstream rule", () => {
    expect(toDomainSection(catalogSection({ cancelled: true })).cancelled).toBe(
      true,
    );
  });
});

describe("loadSections", () => {
  it("asks by course code, comma-joined", async () => {
    const listSections = vi.fn().mockResolvedValue({
      term: 202608,
      sections: [catalogSection()],
    });
    const sections = await loadSections({ listSections }, 202608, {
      courseAbbrs: ["CSCI1301", "MATH2250"],
    });
    expect(listSections).toHaveBeenCalledWith(
      { term: 202608, courses: "CSCI1301,MATH2250" },
      {},
    );
    expect(sections).toHaveLength(1);
  });

  it("splits a long list into calls of at most 15 courses", async () => {
    const listSections = vi
      .fn()
      .mockResolvedValue({ term: 202608, sections: [] });
    const ids = Array.from(
      { length: SECTIONS_PER_REQUEST + 3 },
      (_, i) => i + 1,
    );
    await loadSections({ listSections }, 202608, { courseIds: ids });
    expect(listSections).toHaveBeenCalledTimes(2);
    const asked = (listSections.mock.calls as [{ courseIds: string }][]).map(
      ([params]) => params.courseIds,
    );
    expect(asked[0]?.split(",")).toHaveLength(15);
    expect(asked[1]).toBe("16,17,18");
  });

  it("makes no call for no courses", async () => {
    const listSections = vi.fn();
    expect(
      await loadSections({ listSections }, 202608, { courseIds: [] }),
    ).toEqual([]);
    expect(listSections).not.toHaveBeenCalled();
  });
});
