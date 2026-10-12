/**
 * The shapes DogDays depends on, written out by hand.
 *
 * `@devdogsuga/sdk/catalog` is generated from the catalog's OpenAPI file, so
 * its types follow whatever the catalog says today. These schemas are DogDays'
 * own statement of what it needs, and they fail in two places:
 *
 *   - at compile time (`tsc`), if the generated types stop being assignable to
 *     them: a field DogDays reads was renamed, retyped or removed in an SDK
 *     prerelease;
 *   - at run time (`catalog.contract.test.ts`), if a real catalog answers with
 *     something else.
 *
 * Objects are not strict: a new field in the catalog is fine, a changed or
 * missing one is not. Update a schema only together with the code that reads
 * the field.
 */
import { z } from "zod";
import type {
  CourseDetail,
  CourseExists,
  SearchResults,
  SectionList,
  SubjectCourses,
  SubjectList,
  TermList,
} from "@devdogsuga/sdk/catalog";

/** `YYYY-MM-DD`. */
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** `HH:MM:SS`. */
const time = z.string().regex(/^\d{2}:\d{2}:\d{2}$/);
/** The registrar's term: `YYYYMM` with `MM` of 02, 05 or 08. */
const termCode = z.number().int().min(200002).max(299908);

export const partOfTerm = z.object({
  code: z.string(),
  description: z.string(),
  classesBegin: date,
  dropAddEnds: date,
  censusDate: date,
  withdrawalDeadline: date,
  classesEnd: date,
  finalsEnd: date.nullable(),
});

export const termList = z.object({
  terms: z.array(
    z.object({
      academicPeriod: termCode,
      description: z.string(),
      classesBegin: date.nullable(),
      classesEnd: date.nullable(),
      dropAddEnds: date.nullable(),
      partsOfTerm: z.array(partOfTerm),
    }),
  ),
});

export const subjectList = z.object({
  term: termCode.nullable(),
  subjects: z.array(
    z.object({
      abbr: z.string().min(1),
      description: z.string(),
      courseCount: z.number().int().min(0),
    }),
  ),
});

export const courseSummary = z.object({
  courseId: z.number().int(),
  abbr: z.string().min(1),
  courseNumber: z.string().min(1),
  title: z.string(),
  subject: z.string().min(1),
  minCreditHours: z.number(),
  maxCreditHours: z.number(),
  honors: z.boolean(),
  sectionCount: z.number().int().min(0),
});

export const subjectCourses = z.object({
  term: termCode,
  subject: z.object({ abbr: z.string(), description: z.string() }),
  courses: z.array(courseSummary),
});

export const searchResults = z.object({
  term: termCode,
  query: z.string(),
  limit: z.number().int().min(1).max(50),
  results: z.array(courseSummary).max(50),
});

export const courseDetail = z.object({
  course: z.object({
    courseId: z.number().int(),
    abbr: z.string().min(1),
    courseNumber: z.string().min(1),
    title: z.string(),
    abbrTitle: z.string(),
    subject: z.object({ abbr: z.string(), description: z.string() }),
    college: z.string(),
    department: z.string().nullable(),
    minCreditHours: z.number(),
    maxCreditHours: z.number(),
    minBillingCreditHours: z.number(),
    honors: z.boolean(),
  }),
  details: z
    .object({
      description: z.string().nullable(),
      gradingSystem: z.string().nullable(),
      semesterOffered: z.string().nullable(),
      corequisite: z.string().nullable(),
      equivalentCourses: z.string().nullable(),
      prerequisites: z.unknown(),
      lastFetched: z.string(),
    })
    .nullable(),
  offeredIn: z.array(termCode),
  sectionCount: z.number().int().min(0).nullable(),
});

export const courseExists = z.object({
  abbr: z.string(),
  term: termCode.nullable(),
  exists: z.boolean(),
  offered: z.boolean().nullable(),
});

const building = z.object({
  code: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
});

export const meeting = z.object({
  days: z.array(
    z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
  ),
  startDate: date.nullable(),
  endDate: date.nullable(),
  startTime: time.nullable(),
  endTime: time.nullable(),
  building: building.nullable(),
  room: z.string().nullable(),
  locationStatus: z.enum(["TBA", "NCRR", "RESERVED"]),
});

export const section = z.object({
  crn: z.number().int(),
  courseId: z.number().int(),
  courseAbbr: z.string().min(1),
  courseNumber: z.string().min(1),
  courseTitle: z.string(),
  creditHours: z.object({ min: z.number(), max: z.number() }),
  campus: z.object({
    id: z.number().int(),
    abbr: z.string(),
    description: z.string(),
  }),
  professor: z.object({ name: z.string() }).nullable(),
  seatsAvailable: z.number().int(),
  actualEnrollment: z.number().int(),
  maximumEnrollment: z.number().int(),
  cancelled: z.boolean(),
  lastSeenAt: z.string(),
  academicPeriod: termCode,
  dateRange: z.object({ start: date, end: date }).nullable(),
  meetings: z.array(meeting),
});

export const sectionList = z.object({
  term: termCode,
  sections: z.array(section),
});

export const errorBody = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

// --- compile-time half: the generated types must satisfy the pinned shapes ----

type Pinned<T extends z.ZodType> = z.infer<T>;

/** Fails to compile unless `Sdk` is assignable to `Wanted`. */
type Satisfies<Sdk extends Wanted, Wanted> = Sdk;

export type _Checks = [
  Satisfies<TermList, Pinned<typeof termList>>,
  Satisfies<SubjectList, Pinned<typeof subjectList>>,
  Satisfies<SubjectCourses, Pinned<typeof subjectCourses>>,
  Satisfies<SearchResults, Pinned<typeof searchResults>>,
  Satisfies<CourseDetail, Pinned<typeof courseDetail>>,
  Satisfies<CourseExists, Pinned<typeof courseExists>>,
  Satisfies<SectionList, Pinned<typeof sectionList>>,
];
