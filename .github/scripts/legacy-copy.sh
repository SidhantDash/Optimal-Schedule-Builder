#!/usr/bin/env bash
# Copies the old DogDays member data (the platform's schedule_builder user
# tables) into this project, once, keyed by the platform user id. A copied row
# has no owner here (`userId` is null) and carries `legacyUserId`; the member
# gets it the first time they sign in, through dogdays.claim_legacy_data().
#
#   SRC_URL=<platform, read-only> DST_URL=<this project> legacy-copy.sh [--dry-run] [--name NAME]
#
# SRC_URL    the platform database, as a role that can SELECT the four user
#            tables and nothing else (see .github/scripts/platform-copy-role.sql). The
#            session is also forced read-only.
# DST_URL    this project's database, as the deploy-tier role.
# --dry-run  runs everything, prints the counts, rolls the destination back.
# --name     the ledger key; a second run with the same name does nothing.
#
# It writes counts to the job summary, never row contents: member data stays in
# a temp directory that is removed on exit.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
name=platform-schedule-builder
dry=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry=1 ;;
    --name) name=${2:?--name needs a value}; shift ;;
    *) echo "usage: legacy-copy.sh [--dry-run] [--name NAME]" >&2; exit 2 ;;
  esac
  shift
done
: "${SRC_URL:?SRC_URL (the platform database, read-only) is required}"
: "${DST_URL:?DST_URL (the DogDays database) is required}"
summary=${GITHUB_STEP_SUMMARY:-/dev/stderr}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
chmod 700 "$work"

# Ask first, so a copy that has already happened reads nothing from the platform.
done=$(psql "$DST_URL" -v ON_ERROR_STOP=1 --no-psqlrc -At \
  -c "select exists (select 1 from dogdays.\"legacyImports\" where \"name\" = '$name')")
if [ "$done" = t ]; then
  echo "The copy '$name' is already recorded in dogdays.\"legacyImports\": nothing to do."
  {
    echo '### Legacy copy'
    echo
    echo "The copy \`$name\` was already done. Nothing was read from the platform."
  } >>"$summary"
  exit 0
fi

src() {
  PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=120000' \
    psql "$SRC_URL" -v ON_ERROR_STOP=1 --no-psqlrc -c "$1"
}
src "\\copy (select id, \"userId\", \"academicPeriod\", title, crns, pinned, \"createdAt\", \"updatedAt\" from schedule_builder.\"userSavedPlans\" order by id) to '$work/plans.csv' with (format csv)"
src "\\copy (select \"userId\", \"currentAcademicPeriod\" from schedule_builder.\"userPreferences\" order by \"userId\") to '$work/prefs.csv' with (format csv)"
src "\\copy (select \"userId\", \"academicPeriod\", \"prefStartTime\", \"prefEndTime\", \"inputCampus\", \"minCreditHours\", \"maxCreditHours\", \"showFilledClasses\" from schedule_builder.\"userPlanDrafts\" order by \"userId\", \"academicPeriod\") to '$work/drafts.csv' with (format csv)"
src "\\copy (select id, \"userId\", \"academicPeriod\", \"courseId\", \"excludedCrns\" from schedule_builder.\"userPlanDraftCourses\" order by id) to '$work/draft-courses.csv' with (format csv)"

out=$(cd "$work" && psql "$DST_URL" --no-psqlrc -v import="$name" -v dry="$dry" -f "$here/legacy-copy.sql")
echo "$out"
{
  echo '### Legacy copy'
  echo
  if [ "$dry" = 1 ]; then echo 'Dry run: the destination was rolled back.'; echo; fi
  echo '```'
  echo "$out"
  echo '```'
} >>"$summary"
