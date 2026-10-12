/**
 * The `.dogdays.json` plan file: one saved plan, portable between people and
 * between a signed-out browser and an account. This is the contract the
 * Import/Export milestone builds on; the schema is the foundation. The parser
 * (reading text, rejecting a wrong version or malformed JSON) and the
 * serializer are starter issue work and are not here.
 *
 *     { "version": 1, "term": 202608, "name": "Plan 1",
 *       "crns": [12345, 23456], "pinned": false }
 *
 * `version` is the first thing read, so a future format can be told apart
 * before anything else is trusted. A file is untrusted input: unknown keys are
 * refused (a file that says more than this schema knows is a file from a newer
 * DogDays), and every list and string has a ceiling.
 *
 * Checking the CRNs against the catalog is the importer's job, not this
 * schema's: a CRN is only meaningful for a term, and the catalog is where the
 * term's sections are.
 */
import * as z from "zod";

/** The only version there is. A new shape gets a new number and its own schema. */
export const PLAN_FILE_VERSION = 1;

/** The file's extension, with the dot. */
export const PLAN_FILE_EXTENSION = ".dogdays.json";

/** The plan name field in the app is limited to this many characters. */
export const PLAN_NAME_MAX = 32;

/** A schedule holds a handful of sections; this is generous, not a target. */
export const PLAN_CRNS_MAX = 40;

/** The registrar's term: `YYYYMM` with `MM` of 02, 05 or 08. */
const term = z
  .number()
  .int()
  .refine((value) => /^20\d{2}0[258]$/.test(String(value)), {
    message: "term must be a registrar term like 202608 (month 02, 05 or 08)",
  });

/** A CRN is a positive integer that fits Postgres `int4`, as it does in the database. */
const crn = z.number().int().min(1).max(2_147_483_647);

export const planFileSchema = z.strictObject({
  version: z.literal(PLAN_FILE_VERSION),
  term,
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1).max(PLAN_NAME_MAX)),
  crns: z
    .array(crn)
    .min(1)
    .max(PLAN_CRNS_MAX)
    .refine((list) => new Set(list).size === list.length, {
      message: "crns must not repeat",
    }),
  pinned: z.boolean(),
});

export type PlanFile = z.infer<typeof planFileSchema>;
