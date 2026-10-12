-- The courses in a draft. `courseId` is the catalog's course id (the catalog
-- lives behind /catalog/v1, not in this database), so there is no foreign key.
CREATE TABLE "dogdays"."userPlanDraftCourses" (
  "id"             uuid      NOT NULL DEFAULT gen_random_uuid(),
  "userId"         uuid,
  "legacyUserId"   uuid,
  "academicPeriod" integer   NOT NULL,
  "courseId"       integer   NOT NULL,
  "excludedCrns"   integer[] NOT NULL DEFAULT '{}'::integer[],
  CONSTRAINT "userPlanDraftCourses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "userPlanDraftCourses_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT "userPlanDraftCourses_userId_academicPeriod_courseId_key" UNIQUE ("userId", "academicPeriod", "courseId"),
  CONSTRAINT "userPlanDraftCourses_legacyUserId_academicPeriod_courseId_key" UNIQUE ("legacyUserId", "academicPeriod", "courseId"),
  CONSTRAINT "userPlanDraftCourses_owner_check" CHECK ("userId" IS NOT NULL OR "legacyUserId" IS NOT NULL)
);

ALTER TABLE "dogdays"."userPlanDraftCourses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_draft_courses" ON "dogdays"."userPlanDraftCourses"
  FOR ALL
  TO "authenticated"
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

GRANT SELECT ON TABLE "dogdays"."userPlanDraftCourses" TO "authenticated";
GRANT INSERT ("userId", "academicPeriod", "courseId", "excludedCrns")
  ON TABLE "dogdays"."userPlanDraftCourses" TO "authenticated";
GRANT UPDATE ("userId", "academicPeriod", "courseId", "excludedCrns")
  ON TABLE "dogdays"."userPlanDraftCourses" TO "authenticated";
GRANT DELETE ON TABLE "dogdays"."userPlanDraftCourses" TO "authenticated";
GRANT ALL ON TABLE "dogdays"."userPlanDraftCourses" TO "service_role";
