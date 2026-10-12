/**
 * Contract tests: DogDays' catalog client against a real catalog.
 *
 * What they pin is the response SHAPE and the limits DogDays leans on (caps
 * are `400`, an unknown course code is skipped or `404`, browsers may call it
 * directly), never the data: which courses exist changes every scrape.
 *
 *   CATALOG_URL   which catalog to test; default the staging one. Production is
 *                 checked by the deploy (wait-for-catalog.mjs) and may be
 *                 pointed at here by hand:
 *                 CATALOG_URL=https://api.devdogsuga.org/catalog/v1 pnpm test
 *
 * The client is the SDK's generated one (`@devdogsuga/sdk/catalog`), exactly as
 * the app builds it. Calls go to a public API with no key: no secrets needed,
 * so these run on fork pull requests.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { ApiError, createCatalogClient } from "@devdogsuga/sdk/catalog";
import {
  courseDetail,
  courseExists,
  errorBody,
  searchResults,
  sectionList,
  subjectCourses,
  subjectList,
  termList,
} from "./catalog.schemas";

const baseUrl = (
  process.env["CATALOG_URL"] || "https://api-staging.devdogsuga.org/catalog/v1"
).replace(/\/+$/, "");

const catalog = createCatalogClient({
  baseUrl,
  client: "dogdays-contract/1",
});

/** What the tests learn about the catalog once, to ask real questions of it. */
const known = {
  term: 0,
  subject: "",
  courseAbbr: "",
  courseId: 0,
};

async function expectApiError(
  call: Promise<unknown>,
  status: number,
  code: string,
) {
  const error = await call.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error, `expected a ${status} ${code}`).toBeInstanceOf(ApiError);
  const api = error as ApiError;
  expect(api.status).toBe(status);
  expect(api.code).toBe(code);
  expect(api.message.length).toBeGreaterThan(0);
}

describe(`the catalog at ${baseUrl}`, () => {
  beforeAll(async () => {
    const { terms } = await catalog.listTerms();
    // Newest first; take the first term that has subjects, so a term that was
    // announced but not scraped yet does not turn the suite red.
    for (const term of terms) {
      const { subjects } = await catalog.listSubjects({
        term: term.academicPeriod,
      });
      const subject = subjects.find((s) => s.courseCount > 0);
      if (!subject) continue;
      const { courses } = await catalog.listSubjectCourses({
        abbr: subject.abbr,
        term: term.academicPeriod,
      });
      const course = courses[0];
      if (!course) continue;
      known.term = term.academicPeriod;
      known.subject = subject.abbr;
      known.courseAbbr = course.abbr;
      known.courseId = course.courseId;
      return;
    }
    throw new Error(
      `${baseUrl} has no term with a course in it: nothing to test against.`,
    );
  });

  it("lists terms, newest first, with their parts of term", async () => {
    const body = await catalog.listTerms();
    const parsed = termList.parse(body);
    expect(parsed.terms.length).toBeGreaterThan(0);
    const periods = parsed.terms.map((t) => t.academicPeriod);
    expect(periods).toEqual([...periods].sort((a, b) => b - a));
    expect(parsed.terms.every((t) => t.partsOfTerm.length > 0)).toBe(true);
  });

  it("lists the subjects offered in a term, by abbreviation", async () => {
    const body = subjectList.parse(
      await catalog.listSubjects({ term: known.term }),
    );
    expect(body.term).toBe(known.term);
    const abbrs = body.subjects.map((s) => s.abbr);
    expect(abbrs).toEqual([...abbrs].sort());
  });

  it("lists every subject without a term", async () => {
    const body = subjectList.parse(await catalog.listSubjects());
    expect(body.term).toBeNull();
    expect(body.subjects.length).toBeGreaterThan(0);
  });

  it("lists the courses of a subject in a term", async () => {
    const body = subjectCourses.parse(
      await catalog.listSubjectCourses({
        abbr: known.subject,
        term: known.term,
      }),
    );
    expect(body.subject.abbr).toBe(known.subject);
    expect(body.courses.every((c) => c.subject === known.subject)).toBe(true);
  });

  it("searches, finds a course by its code, and puts the exact code first", async () => {
    const body = searchResults.parse(
      await catalog.searchCourses({ term: known.term, q: known.courseAbbr }),
    );
    expect(body.term).toBe(known.term);
    expect(body.results[0]?.abbr).toBe(known.courseAbbr);
  });

  it("finds a code with a space in it, and honours limit", async () => {
    const spaced = known.courseAbbr.replace(/^([A-Za-z]+)/, "$1 ");
    const body = searchResults.parse(
      await catalog.searchCourses({ term: known.term, q: spaced, limit: 1 }),
    );
    expect(body.limit).toBe(1);
    expect(body.results).toHaveLength(1);
    expect(body.results[0]?.abbr).toBe(known.courseAbbr);
  });

  it("refuses more than 50 results and a missing query with a 400, not a truncation", async () => {
    await expectApiError(
      catalog.searchCourses({ term: known.term, q: "a", limit: 51 }),
      400,
      "invalid_parameter",
    );
    await expectApiError(
      catalog.searchCourses({ term: known.term, q: "" }),
      400,
      "missing_parameter",
    );
  });

  it("returns a course with its Bulletin details and the terms it is offered in", async () => {
    const body = courseDetail.parse(
      await catalog.getCourse({ abbr: known.courseAbbr, term: known.term }),
    );
    expect(body.course.abbr).toBe(known.courseAbbr);
    expect(body.course.courseId).toBe(known.courseId);
    expect(body.offeredIn).toContain(known.term);
    expect(body.sectionCount).not.toBeNull();
  });

  it("matches a course code without regard to case or spaces", async () => {
    const sloppy = known.courseAbbr.replace(/^([A-Za-z]+)/, "$1 ").toLowerCase();
    const body = courseDetail.parse(await catalog.getCourse({ abbr: sloppy }));
    expect(body.course.courseId).toBe(known.courseId);
    expect(body.sectionCount).toBeNull();
  });

  it("answers a code it has never seen with a 404", async () => {
    await expectApiError(
      catalog.getCourse({ abbr: "ZZZZ9999" }),
      404,
      "not_found",
    );
  });

  it("checks that a course exists, always with a 200", async () => {
    const yes = courseExists.parse(
      await catalog.courseExists({ abbr: known.courseAbbr, term: known.term }),
    );
    expect(yes).toMatchObject({
      abbr: known.courseAbbr,
      exists: true,
      offered: true,
    });
    const no = courseExists.parse(
      await catalog.courseExists({ abbr: "ZZZZ9999" }),
    );
    expect(no.exists).toBe(false);
  });

  it("returns the sections of a course, by code or by id, with their meetings", async () => {
    const byCode = sectionList.parse(
      await catalog.listSections({
        term: known.term,
        courses: known.courseAbbr,
      }),
    );
    expect(byCode.term).toBe(known.term);
    expect(byCode.sections.length).toBeGreaterThan(0);
    for (const s of byCode.sections) {
      expect(s.academicPeriod).toBe(known.term);
      expect(s.courseId).toBe(known.courseId);
    }
    const byId = sectionList.parse(
      await catalog.listSections({
        term: known.term,
        courseIds: String(known.courseId),
      }),
    );
    expect(byId.sections.map((s) => s.crn).sort()).toEqual(
      byCode.sections.map((s) => s.crn).sort(),
    );
  });

  it("skips a course code it does not know instead of failing the request", async () => {
    const body = sectionList.parse(
      await catalog.listSections({
        term: known.term,
        courses: `${known.courseAbbr},ZZZZ9999`,
      }),
    );
    expect(body.sections.every((s) => s.courseId === known.courseId)).toBe(true);
  });

  it("takes at most 15 courses in one request", async () => {
    // Distinct codes: a repeated one would be counted once.
    const sixteen = Array.from({ length: 16 }, (_, i) => `ZZZZ${1000 + i}`).join(",");
    await expectApiError(
      catalog.listSections({ term: known.term, courses: sixteen }),
      400,
      "too_many_courses",
    );
  });

  it("can be called from a browser: CORS allows any origin, errors have the shared body", async () => {
    const ok = await fetch(`${baseUrl}/terms`, {
      headers: { origin: "https://dogdays.dev" },
    });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("access-control-allow-origin")).toBe("*");
    const bad = await fetch(`${baseUrl}/search?term=${known.term}&q=a&limit=51`, {
      headers: { origin: "https://dogdays.dev" },
    });
    expect(bad.status).toBe(400);
    expect(bad.headers.get("access-control-allow-origin")).toBe("*");
    errorBody.parse(await bad.json());
  });
});
