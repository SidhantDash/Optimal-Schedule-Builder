-- One row per bulk copy of the old (platform-hosted) DogDays data into this
-- project. `.github/scripts/legacy-copy.sh` reads it first and does nothing if
-- its import is already recorded, so a plan a member deletes after claiming
-- their data never comes back with the next deploy. Nobody but the deploy
-- (service_role) can touch it: RLS on, no policy.
CREATE TABLE "dogdays"."legacyImports" (
  "name"      text        NOT NULL,
  "copiedAt"  timestamptz NOT NULL DEFAULT now(),
  "rowCounts" jsonb       NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "legacyImports_pkey" PRIMARY KEY ("name")
);

ALTER TABLE "dogdays"."legacyImports" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "dogdays"."legacyImports" TO "service_role";
