/**
 * Waits until a catalog serves the terms DogDays needs, then exits 0.
 *
 * The production deploy runs this first. DogDays' new Worker reads the catalog
 * for everything it shows, so switching traffic to it before the production
 * catalog has the current and the next term would put an empty app in front of
 * every student. Both come from the platform's deploy (the catalog is its
 * Worker), so on the first DogDays deploy this is the job that waits for the
 * platform to be live.
 *
 * "Serves" means the term is listed (the catalog lists a term only when it has
 * a section that is not cancelled) and has subjects.
 *
 * Which terms:
 *   current  the term that began most recently (classesBegin on or before today)
 *   next     the first Spring (02) or Fall (08) term that begins after today;
 *            Summer is never required, it is often not published yet
 *
 * Environment:
 *   CATALOG_URL        default https://api.devdogsuga.org/catalog/v1
 *   WAIT_MINUTES       how long to keep trying; default 120 (0 = one attempt)
 *   INTERVAL_SECONDS   between attempts; default 30
 *   REQUIRE_TERMS      comma-separated terms to require instead of the rule
 *   TODAY              YYYY-MM-DD, for tests
 *
 * Usage: node wait-for-catalog.mjs
 */
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DEFAULT_CATALOG = "https://api.devdogsuga.org/catalog/v1";

/**
 * @param {{ academicPeriod: number, classesBegin: string | null }[]} terms
 * @param {string} today YYYY-MM-DD
 * @returns {{ current: number | null, next: number | null }}
 */
export function pickTerms(terms, today) {
  const dated = terms
    .filter((t) => typeof t.classesBegin === "string")
    .sort((a, b) => a.classesBegin.localeCompare(b.classesBegin));
  const started = dated.filter((t) => t.classesBegin <= today);
  const current = started.at(-1)?.academicPeriod ?? null;
  const next =
    dated.find(
      (t) =>
        t.classesBegin > today &&
        [2, 8].includes(t.academicPeriod % 100) &&
        t.academicPeriod !== current,
    )?.academicPeriod ?? null;
  return { current, next };
}

/**
 * One attempt. Returns the problems; empty means the catalog is ready.
 *
 * @param {{ catalog: string, today: string, require?: number[], fetchImpl?: typeof fetch }} input
 * @returns {Promise<{ problems: string[], required: number[] }>}
 */
export async function check({
  catalog,
  today,
  require = [],
  fetchImpl = fetch,
}) {
  const get = async (path) => {
    const response = await fetchImpl(`${catalog}${path}`, {
      headers: { "x-client": "dogdays-deploy" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
    return response.json();
  };

  /** @type {string[]} */
  const problems = [];
  let terms;
  try {
    ({ terms } = await get("/terms"));
  } catch (error) {
    return {
      problems: [`the catalog is not answering: ${error.message}`],
      required: [],
    };
  }
  if (!Array.isArray(terms)) {
    return { problems: ["GET /terms did not return a terms list"], required: [] };
  }

  let required = require;
  if (required.length === 0) {
    const { current, next } = pickTerms(terms, today);
    if (current === null) problems.push(`no listed term has begun by ${today}`);
    if (next === null) {
      problems.push(`no Spring or Fall term after ${today} is listed`);
    }
    required = [current, next].filter((t) => t !== null);
  }

  const listed = new Set(terms.map((t) => t.academicPeriod));
  for (const term of required) {
    if (!listed.has(term)) {
      problems.push(`term ${term} is not listed`);
      continue;
    }
    try {
      const { subjects } = await get(`/subjects?term=${term}`);
      if (!Array.isArray(subjects) || subjects.length === 0) {
        problems.push(`term ${term} is listed but has no subjects`);
      }
    } catch (error) {
      problems.push(`term ${term}: ${error.message}`);
    }
  }
  return { problems, required };
}

/** @param {NodeJS.ProcessEnv} env */
export async function main(env = process.env, log = console.log) {
  const catalog = (env.CATALOG_URL || DEFAULT_CATALOG).replace(/\/+$/, "");
  const today = env.TODAY || new Date().toISOString().slice(0, 10);
  const minutes = Number(env.WAIT_MINUTES ?? 120);
  const interval = Number(env.INTERVAL_SECONDS ?? 30) * 1000;
  const require = (env.REQUIRE_TERMS || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(Boolean);
  const deadline = Date.now() + minutes * 60_000;

  for (let attempt = 1; ; attempt++) {
    const { problems, required } = await check({ catalog, today, require });
    if (problems.length === 0) {
      log(`ready: ${catalog} serves ${required.join(" and ")} (attempt ${attempt})`);
      if (env.GITHUB_STEP_SUMMARY) {
        appendFileSync(
          env.GITHUB_STEP_SUMMARY,
          `### Catalog\n\n\`${catalog}\` serves ${required.map((t) => `\`${t}\``).join(" and ")}.\n`,
        );
      }
      return 0;
    }
    log(`waiting (attempt ${attempt}): ${problems.join("; ")}`);
    if (Date.now() + interval > deadline) {
      log(`gave up after ${minutes} minutes: ${problems.join("; ")}`);
      if (env.GITHUB_STEP_SUMMARY) {
        appendFileSync(
          env.GITHUB_STEP_SUMMARY,
          `### Catalog\n\nNot ready after ${minutes} minutes: ${problems.join("; ")}.\n`,
        );
      }
      return 1;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().then((code) => process.exit(code));
}
