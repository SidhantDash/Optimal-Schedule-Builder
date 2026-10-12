-- The one credential the legacy copy needs on the PLATFORM database: a login
-- that can read the four DogDays user tables and nothing else. Run it once per
-- platform environment, as an admin, before the first DogDays deploy there:
--
--   psql "$PLATFORM_ADMIN_URL" -v password="$(openssl rand -base64 24 | tr '+/' '-_' | tr -d '=')" \
--        -f .github/scripts/platform-copy-role.sql
--
-- It is TEMPORARY. The grants and policies it adds are not in the platform's
-- supabase/schemas tree, so the next platform deploy that runs while they exist
-- would plan to REVOKE and DROP them (a policy drop asks for the destructive
-- approval). Run platform-copy-role-drop.sql as soon as the copy has run.
--
-- Then put the connection string for `dogdays_copy` (same host and port as the
-- admin one, user `dogdays_copy.<project-ref>` through the Supabase pooler) in
-- the DogDays environment secret PLATFORM_DB_URL. Rolling the password is
-- `alter role dogdays_copy password '...'`. Remove the role (and the secret)
-- once the copy has run.
\set ON_ERROR_STOP on

select exists (select 1 from pg_roles where rolname = 'dogdays_copy') as present \gset
\if :present
  alter role dogdays_copy with login password :'password';
\else
  create role dogdays_copy with login password :'password' nosuperuser nocreatedb nocreaterole noinherit;
\endif

-- Never bypasses row level security and never writes, whatever else is granted.
alter role dogdays_copy set default_transaction_read_only = on;
alter role dogdays_copy set statement_timeout = '2min';

grant usage on schema schedule_builder to dogdays_copy;
grant select on table
  schedule_builder."userSavedPlans",
  schedule_builder."userPreferences",
  schedule_builder."userPlanDrafts",
  schedule_builder."userPlanDraftCourses"
to dogdays_copy;

-- These four tables have RLS on with policies for `authenticated` only, so the
-- role needs its own policy to see any rows. Policies are additive and this one
-- is for this role alone.
drop policy if exists dogdays_copy_read on schedule_builder."userSavedPlans";
drop policy if exists dogdays_copy_read on schedule_builder."userPreferences";
drop policy if exists dogdays_copy_read on schedule_builder."userPlanDrafts";
drop policy if exists dogdays_copy_read on schedule_builder."userPlanDraftCourses";
create policy dogdays_copy_read on schedule_builder."userSavedPlans" for select to dogdays_copy using (true);
create policy dogdays_copy_read on schedule_builder."userPreferences" for select to dogdays_copy using (true);
create policy dogdays_copy_read on schedule_builder."userPlanDrafts" for select to dogdays_copy using (true);
create policy dogdays_copy_read on schedule_builder."userPlanDraftCourses" for select to dogdays_copy using (true);
