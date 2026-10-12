-- Removes what platform-copy-role.sql added to the PLATFORM database, leaving
-- it exactly as its supabase/schemas tree says. Run as an admin after the
-- DogDays copy has run (and delete the PLATFORM_DB_URL secret):
--
--   psql "$PLATFORM_ADMIN_URL" -f .github/scripts/platform-copy-role-drop.sql
\set ON_ERROR_STOP on

drop policy if exists dogdays_copy_read on schedule_builder."userSavedPlans";
drop policy if exists dogdays_copy_read on schedule_builder."userPreferences";
drop policy if exists dogdays_copy_read on schedule_builder."userPlanDrafts";
drop policy if exists dogdays_copy_read on schedule_builder."userPlanDraftCourses";

revoke select on table
  schedule_builder."userSavedPlans",
  schedule_builder."userPreferences",
  schedule_builder."userPlanDrafts",
  schedule_builder."userPlanDraftCourses"
from dogdays_copy;
revoke usage on schema schedule_builder from dogdays_copy;
drop role if exists dogdays_copy;
