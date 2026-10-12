---
name: The course catalog
description: Where courses, terms and sections come from, and what that means for the code you write.
order: 22
section: guides
---

# The course catalog

DogDays does not scrape the registrar and does not store courses. Every term,
subject, course and section comes from the DevDogs **catalog API**, a public,
read-only, keyless service the club runs for all of its apps.

| Environment | `NEXT_PUBLIC_CATALOG_URL` |
| --- | --- |
| Local development, staging | `https://api-staging.devdogsuga.org/catalog/v1` (the default in `.env.example`) |
| Production | `https://api.devdogsuga.org/catalog/v1` |

The staging catalog has real terms and sections, so you can build against it
with nothing to set up.

## The client

`src/catalog/index.ts` wraps the generated client from `@devdogsuga/sdk/catalog`,
and `src/catalog/browser.ts` is the one instance the app uses, in the browser
and in server actions alike (the catalog allows any origin).

| You want | Call | Used by |
| --- | --- | --- |
| The terms | `listTerms()` | `useTerms`, the term picker |
| Subjects with a course on offer | `listSubjects({ term })` | By Subject |
| Courses in a subject | `listSubjectCourses({ abbr, term })` | By Subject |
| Search by code or title | `searchCourses({ term, q })` | Course Search |
| Every section of up to 15 courses | `listSections({ term, courses \| courseIds })` | the section picker, schedule generation, saved plans |

Hooks that read the catalog live in `src/hooks/queries/`. `loadSections`
(`src/lib/domain/catalogSections.ts`) turns the catalog's sections into the
domain `Section` the generator reads, and splits a long course list into calls
of 15.

## Two things the catalog cannot do

- **Look up a section by CRN.** `listSections` is by course. A saved plan stores
  its CRNs *and* the catalog course ids it came from (`userSavedPlans.courseIds`)
  so it can read its sections back. Plans copied from the old app have no course
  ids and fall back to the term's current draft.
- **List instructors.** There is no By Instructor search.

Both would be catalog changes, not DogDays changes. Ask in the club Discord
before working around them.

## `contract/`

`contract/` pins the shapes DogDays reads, as zod schemas, and runs them against
a live catalog in CI. If you start reading a field the schemas do not list, add
it there first.
