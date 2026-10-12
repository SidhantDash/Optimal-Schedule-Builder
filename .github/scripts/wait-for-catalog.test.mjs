import assert from "node:assert/strict";
import { test } from "node:test";
import { check, main, pickTerms } from "./wait-for-catalog.mjs";

const terms = [
  { academicPeriod: 202708, classesBegin: "2027-08-16" },
  { academicPeriod: 202705, classesBegin: "2027-05-17" },
  { academicPeriod: 202702, classesBegin: "2027-01-11" },
  { academicPeriod: 202608, classesBegin: "2026-08-13" },
  { academicPeriod: 202605, classesBegin: "2026-05-11" },
];

test("in October the current term is Fall and the next is Spring", () => {
  assert.deepEqual(pickTerms(terms, "2026-10-12"), {
    current: 202608,
    next: 202702,
  });
});

test("Summer is current while it runs but never required as the next term", () => {
  assert.deepEqual(pickTerms(terms, "2027-06-01"), {
    current: 202705,
    next: 202708,
  });
  assert.deepEqual(pickTerms(terms, "2027-02-01"), {
    current: 202702,
    next: 202708,
  });
});

test("a term with no start date is ignored", () => {
  assert.deepEqual(
    pickTerms([{ academicPeriod: 202702, classesBegin: null }], "2026-10-12"),
    { current: null, next: null },
  );
});

/** A catalog that serves `listed` terms, and subjects for the ones in `withSubjects`. */
function fakeCatalog(listed, withSubjects = listed) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const path = url.replace("https://c.test", "");
    if (path === "/terms") {
      return Response.json({
        terms: terms.filter((t) => listed.includes(t.academicPeriod)),
      });
    }
    const term = Number(new URL(url).searchParams.get("term"));
    return Response.json({
      term,
      subjects: withSubjects.includes(term) ? [{ abbr: "CSCI" }] : [],
    });
  };
  return { fetchImpl, calls };
}

test("ready when the current and the next term are listed and have subjects", async () => {
  const { fetchImpl } = fakeCatalog([202608, 202702]);
  const result = await check({
    catalog: "https://c.test",
    today: "2026-10-12",
    fetchImpl,
  });
  assert.deepEqual(result, { problems: [], required: [202608, 202702] });
});

test("not ready when the next term is missing", async () => {
  const { fetchImpl } = fakeCatalog([202608]);
  const result = await check({
    catalog: "https://c.test",
    today: "2026-10-12",
    fetchImpl,
  });
  assert.ok(result.problems.some((p) => /no Spring or Fall term after/.test(p)));
});

test("not ready when a listed term has no subjects", async () => {
  const { fetchImpl } = fakeCatalog([202608, 202702], [202608]);
  const result = await check({
    catalog: "https://c.test",
    today: "2026-10-12",
    fetchImpl,
  });
  assert.deepEqual(result.problems, ["term 202702 is listed but has no subjects"]);
});

test("REQUIRE_TERMS replaces the rule", async () => {
  const { fetchImpl } = fakeCatalog([202608]);
  const ok = await check({
    catalog: "https://c.test",
    today: "2026-10-12",
    require: [202608],
    fetchImpl,
  });
  assert.deepEqual(ok.problems, []);
  const missing = await check({
    catalog: "https://c.test",
    today: "2026-10-12",
    require: [202608, 202702],
    fetchImpl,
  });
  assert.deepEqual(missing.problems, ["term 202702 is not listed"]);
});

test("a catalog that does not answer is a problem, not a crash", async () => {
  const result = await check({
    catalog: "https://c.test",
    today: "2026-10-12",
    fetchImpl: async () => new Response("no", { status: 522 }),
  });
  assert.match(result.problems[0], /not answering: GET \/terms answered 522/);
});

test("main gives up with 1 when the wait is over", async () => {
  const lines = [];
  const code = await main(
    {
      CATALOG_URL: "https://127.0.0.1:1/catalog/v1",
      WAIT_MINUTES: "0",
      TODAY: "2026-10-12",
    },
    (line) => lines.push(line),
  );
  assert.equal(code, 1);
  assert.match(lines.at(-1), /gave up after 0 minutes/);
});
