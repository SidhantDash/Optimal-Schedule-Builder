-- The destination half of legacy-copy.sh. Run from the directory holding the
-- four CSVs the source half wrote, with:
--   psql -v import=<name> -v dry=<0|1> -f legacy-copy.sql "$DST_URL"
--
-- One transaction: either every table is copied and the import is recorded, or
-- nothing is. Every insert is `on conflict do nothing` on a key the old data
-- already had, so a rerun adds only what is new.
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned

begin;

select exists (select 1 from dogdays."legacyImports" where "name" = :'import') as done \gset
\if :done
  \echo already copied (dogdays."legacyImports" has :import): nothing to do
  rollback;
  \quit
\endif

create temp table src_plans (
  id uuid, "userId" uuid, "academicPeriod" integer, title text, crns integer[],
  pinned boolean, "createdAt" timestamp, "updatedAt" timestamp
) on commit drop;
create temp table src_prefs ("userId" uuid, "currentAcademicPeriod" integer) on commit drop;
create temp table src_drafts (
  "userId" uuid, "academicPeriod" integer, "prefStartTime" time, "prefEndTime" time,
  "inputCampus" text, "minCreditHours" integer, "maxCreditHours" integer, "showFilledClasses" boolean
) on commit drop;
create temp table src_draft_courses (
  id uuid, "userId" uuid, "academicPeriod" integer, "courseId" integer, "excludedCrns" integer[]
) on commit drop;

\copy src_plans from 'plans.csv' with (format csv)
\copy src_prefs from 'prefs.csv' with (format csv)
\copy src_drafts from 'drafts.csv' with (format csv)
\copy src_draft_courses from 'draft-courses.csv' with (format csv)

-- The platform stored these as `timestamp` in UTC.
with ins as (
  insert into dogdays."userSavedPlans"
    ("id", "legacyUserId", "academicPeriod", "title", "crns", "pinned", "createdAt", "updatedAt")
  select id, "userId", "academicPeriod", title, crns, pinned,
         "createdAt" at time zone 'UTC', "updatedAt" at time zone 'UTC'
    from src_plans
  on conflict ("id") do nothing
  returning 1
) select count(*) as plans from ins \gset

with ins as (
  insert into dogdays."userPreferences" ("legacyUserId", "currentAcademicPeriod")
  select "userId", "currentAcademicPeriod" from src_prefs
  on conflict ("legacyUserId") do nothing
  returning 1
) select count(*) as prefs from ins \gset

with ins as (
  insert into dogdays."userPlanDrafts"
    ("legacyUserId", "academicPeriod", "prefStartTime", "prefEndTime", "inputCampus",
     "minCreditHours", "maxCreditHours", "showFilledClasses")
  select "userId", "academicPeriod", "prefStartTime", "prefEndTime", "inputCampus",
         "minCreditHours", "maxCreditHours", "showFilledClasses"
    from src_drafts
  on conflict ("legacyUserId", "academicPeriod") do nothing
  returning 1
) select count(*) as drafts from ins \gset

with ins as (
  insert into dogdays."userPlanDraftCourses"
    ("id", "legacyUserId", "academicPeriod", "courseId", "excludedCrns")
  select id, "userId", "academicPeriod", "courseId", "excludedCrns" from src_draft_courses
  on conflict do nothing
  returning 1
) select count(*) as draft_courses from ins \gset

select jsonb_build_object(
  'savedPlans', :plans, 'preferences', :prefs, 'drafts', :drafts, 'draftCourses', :draft_courses,
  'sourceUsers', (select count(distinct u) from (
      select "userId" u from src_plans union select "userId" from src_prefs
      union select "userId" from src_drafts union select "userId" from src_draft_courses) x)
) as counts \gset

insert into dogdays."legacyImports" ("name", "rowCounts") values (:'import', :'counts'::jsonb);

\echo copied :counts
\if :dry
  \echo dry run: rolling back, nothing was written
  rollback;
\else
  commit;
\endif
