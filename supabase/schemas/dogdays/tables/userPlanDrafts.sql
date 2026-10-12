-- The unsaved plan for one term: scheduling preferences. The courses in it are
-- userPlanDraftCourses.
CREATE TABLE "dogdays"."userPlanDrafts" (
  "id"                uuid    NOT NULL DEFAULT gen_random_uuid(),
  "userId"            uuid,
  "legacyUserId"      uuid,
  "academicPeriod"    integer NOT NULL,
  "prefStartTime"     time without time zone,
  "prefEndTime"       time without time zone,
  "inputCampus"       text,
  "minCreditHours"    integer NOT NULL DEFAULT 12,
  "maxCreditHours"    integer NOT NULL DEFAULT 18,
  "showFilledClasses" boolean NOT NULL DEFAULT false,
  CONSTRAINT "userPlanDrafts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "userPlanDrafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT "userPlanDrafts_userId_academicPeriod_key" UNIQUE ("userId", "academicPeriod"),
  CONSTRAINT "userPlanDrafts_legacyUserId_academicPeriod_key" UNIQUE ("legacyUserId", "academicPeriod"),
  CONSTRAINT "userPlanDrafts_owner_check" CHECK ("userId" IS NOT NULL OR "legacyUserId" IS NOT NULL)
);

ALTER TABLE "dogdays"."userPlanDrafts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_drafts" ON "dogdays"."userPlanDrafts"
  FOR ALL
  TO "authenticated"
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

GRANT SELECT ON TABLE "dogdays"."userPlanDrafts" TO "authenticated";
GRANT INSERT ("userId", "academicPeriod", "prefStartTime", "prefEndTime", "inputCampus", "minCreditHours", "maxCreditHours", "showFilledClasses")
  ON TABLE "dogdays"."userPlanDrafts" TO "authenticated";
GRANT UPDATE ("userId", "academicPeriod", "prefStartTime", "prefEndTime", "inputCampus", "minCreditHours", "maxCreditHours", "showFilledClasses")
  ON TABLE "dogdays"."userPlanDrafts" TO "authenticated";
GRANT DELETE ON TABLE "dogdays"."userPlanDrafts" TO "authenticated";
GRANT ALL ON TABLE "dogdays"."userPlanDrafts" TO "service_role";
