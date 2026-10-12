#!/usr/bin/env bash
# End-to-end test of the legacy copy, against the local Supabase stack
# db-check.sh starts. A stand-in for the platform's schedule_builder tables is
# built in a second database on the same server; the platform-side role comes
# from the real platform-copy-role.sql; the destination is the stack's own
# database, which has the dogdays schema applied. Everything it adds to the
# destination is removed again.
#
# Environment:
#   LOCAL_DB_URL   the stack's database; default the Supabase local one
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
dst=${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}
admin=${dst%/*}/postgres
srcdb=legacy_copy_src
src_admin=${dst%/*}/$srcdb
# The role's own login, on the stand-in.
password=copy-test-password
src_url=$(printf '%s' "$src_admin" | sed "s#//[^@]*@#//dogdays_copy:$password@#")
summary=$(mktemp)
export GITHUB_STEP_SUMMARY=$summary

psql_dst() { psql "$dst" -v ON_ERROR_STOP=1 --no-psqlrc -At "$@"; }
fail() { echo "legacy-copy.test: $*" >&2; exit 1; }
expect() { # expect <what> <want> <got>
  [ "$2" = "$3" ] || fail "$1: wanted '$2', got '$3'"
  echo "ok - $1"
}
# jsonb has its own key order; compare through it.
json() { psql "$dst" -At --no-psqlrc -c "select '$1'::jsonb"; }
expect_json() { expect "$1" "$(json "$2")" "$(json "$3")"; }

cleanup() {
  psql_dst -c "delete from dogdays.\"userSavedPlans\" where \"legacyUserId\" in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')" >/dev/null || true
  psql_dst -c "delete from dogdays.\"userPreferences\" where \"legacyUserId\" in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')" >/dev/null || true
  psql_dst -c "delete from dogdays.\"userPlanDrafts\" where \"legacyUserId\" in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')" >/dev/null || true
  psql_dst -c "delete from dogdays.\"userPlanDraftCourses\" where \"legacyUserId\" in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')" >/dev/null || true
  psql_dst -c "delete from dogdays.\"legacyImports\" where \"name\" like 'test-%'" >/dev/null || true
  psql_dst -c "delete from auth.users where email = 'claimer@dogdays.devdogsuga.test'" >/dev/null || true
  psql "$admin" --no-psqlrc -qc "drop database if exists $srcdb with (force)" >/dev/null || true
  psql "$admin" --no-psqlrc -qc "drop role if exists dogdays_copy" >/dev/null || true
  rm -f "$summary"
}
trap cleanup EXIT
cleanup

# --- the stand-in for the platform --------------------------------------------
psql "$admin" -v ON_ERROR_STOP=1 --no-psqlrc -qc "create database $srcdb"
psql "$src_admin" -v ON_ERROR_STOP=1 --no-psqlrc -q <<'SQL'
create schema schedule_builder;
create table schedule_builder."userSavedPlans" (
  id uuid not null default gen_random_uuid() primary key, "userId" uuid not null,
  "academicPeriod" integer not null, title varchar not null, crns integer[] not null,
  pinned boolean not null default false,
  "createdAt" timestamp without time zone not null default now(),
  "updatedAt" timestamp without time zone not null default now());
create table schedule_builder."userPreferences" (
  "userId" uuid primary key, "currentAcademicPeriod" integer);
create table schedule_builder."userPlanDrafts" (
  "userId" uuid not null, "academicPeriod" integer not null,
  "prefStartTime" time, "prefEndTime" time, "inputCampus" varchar,
  "minCreditHours" integer not null default 12, "maxCreditHours" integer not null default 18,
  "showFilledClasses" boolean not null default false,
  primary key ("userId", "academicPeriod"));
create table schedule_builder."userPlanDraftCourses" (
  id uuid not null default gen_random_uuid() primary key, "userId" uuid not null,
  "academicPeriod" integer not null, "courseId" integer not null,
  "excludedCrns" integer[] not null default '{}'::integer[]);
alter table schedule_builder."userSavedPlans" enable row level security;
alter table schedule_builder."userPreferences" enable row level security;
alter table schedule_builder."userPlanDrafts" enable row level security;
alter table schedule_builder."userPlanDraftCourses" enable row level security;
create schema secret; create table secret.t (x int); insert into secret.t values (1);

insert into schedule_builder."userSavedPlans" (id, "userId", "academicPeriod", title, crns, pinned, "createdAt", "updatedAt") values
  ('10000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 202608, 'Fall, "quoted", plan', '{11111,22222}', true, '2026-09-01 12:00:00', '2026-09-02 13:30:00'),
  ('10000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 202702, 'Spring', '{}', false, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
  ('10000000-0000-4000-8000-000000000003', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 202608, 'Other member', '{33333}', false, '2026-09-05 00:00:00', '2026-09-05 00:00:00');
insert into schedule_builder."userPreferences" values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 202608), ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', null);
insert into schedule_builder."userPlanDrafts" ("userId", "academicPeriod", "prefStartTime", "inputCampus", "minCreditHours") values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 202608, '09:30', 'Athens', 9),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 202702, null, null, 12);
insert into schedule_builder."userPlanDraftCourses" (id, "userId", "academicPeriod", "courseId", "excludedCrns") values
  ('20000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 202608, 4101, '{55555}'),
  ('20000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 202608, 4102, '{}');
SQL
# The real role, from the real file.
psql "$src_admin" -v ON_ERROR_STOP=1 -v password="$password" --no-psqlrc -q \
  -f "$here/platform-copy-role.sql" >/dev/null

# --- the role is as narrow as it claims ----------------------------------------
expect "the copy role reads the plans" 3 "$(psql "$src_url" -At --no-psqlrc -c 'select count(*) from schedule_builder."userSavedPlans"')"
if psql "$src_url" -At --no-psqlrc -c 'select * from secret.t' >/dev/null 2>&1; then fail "the copy role can read another schema"; fi
echo "ok - the copy role cannot read other schemas"
if psql "$src_url" -At --no-psqlrc -c 'delete from schedule_builder."userSavedPlans"' >/dev/null 2>&1; then fail "the copy role can write"; fi
echo "ok - the copy role cannot write"

export SRC_URL=$src_url DST_URL=$dst

# --- a dry run changes nothing ---------------------------------------------------
"$here/legacy-copy.sh" --dry-run --name test-platform >/dev/null
expect "a dry run leaves no ledger row" 0 "$(psql_dst -c "select count(*) from dogdays.\"legacyImports\" where name = 'test-platform'")"
expect "a dry run copies no plans" 0 "$(psql_dst -c "select count(*) from dogdays.\"userSavedPlans\" where \"legacyUserId\" is not null and title in ('Spring','Other member')")"

# --- the copy ---------------------------------------------------------------------
"$here/legacy-copy.sh" --name test-platform >/dev/null
expect_json "the copy records its counts" \
  '{"drafts": 2, "savedPlans": 3, "preferences": 2, "draftCourses": 2, "sourceUsers": 2}' \
  "$(psql_dst -c "select \"rowCounts\" from dogdays.\"legacyImports\" where name = 'test-platform'")"
expect "copied plans keep the platform id" t \
  "$(psql_dst -c "select exists (select 1 from dogdays.\"userSavedPlans\" where id = '10000000-0000-4000-8000-000000000001' and \"legacyUserId\" = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and \"userId\" is null and title = 'Fall, \"quoted\", plan' and pinned and crns = '{11111,22222}')")"
expect "timestamps are read as UTC" '2026-09-02 13:30:00+00' \
  "$(psql_dst -c "set timezone = 'UTC'; select \"updatedAt\" from dogdays.\"userSavedPlans\" where id = '10000000-0000-4000-8000-000000000001'" | tail -1)"
expect "an empty crns array survives" '{}' \
  "$(psql_dst -c "select crns from dogdays.\"userSavedPlans\" where id = '10000000-0000-4000-8000-000000000002'")"
expect "draft times and nulls survive" '09:30:00|Athens|9' \
  "$(psql_dst -c "select \"prefStartTime\"||'|'||\"inputCampus\"||'|'||\"minCreditHours\" from dogdays.\"userPlanDrafts\" where \"legacyUserId\" = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and \"academicPeriod\" = 202608")"
expect "excluded CRNs survive" '{55555}' \
  "$(psql_dst -c "select \"excludedCrns\" from dogdays.\"userPlanDraftCourses\" where id = '20000000-0000-4000-8000-000000000001'")"
expect "nothing is owned until it is claimed" 0 \
  "$(psql_dst -c "select count(*) from dogdays.\"userSavedPlans\" where \"legacyUserId\" in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') and \"userId\" is not null")"

# --- a second run does nothing ----------------------------------------------------
out=$("$here/legacy-copy.sh" --name test-platform)
case "$out" in *"already recorded"*) echo "ok - a second run says it is done" ;; *) fail "second run: $out" ;; esac
# --- and a rerun under another name adds nothing: every insert is on-conflict ----
"$here/legacy-copy.sh" --name test-platform-again >/dev/null
expect_json "a rerun under another name copies nothing twice" \
  '{"drafts": 0, "savedPlans": 0, "preferences": 0, "draftCourses": 0, "sourceUsers": 2}' \
  "$(psql_dst -c "select \"rowCounts\" from dogdays.\"legacyImports\" where name = 'test-platform-again'")"

# --- the claim moves the copied rows to the member who signs in ----------------
psql_dst -q <<'SQL'
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000e5', 'claimer@dogdays.devdogsuga.test', 'authenticated', 'authenticated');
insert into auth.identities (provider_id, user_id, identity_data, provider) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-4000-8000-0000000000e5', '{}', 'custom:devdogsuga');
SQL
claimed=$(psql_dst -c "
  begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{\"sub\":\"00000000-0000-4000-8000-0000000000e5\",\"role\":\"authenticated\"}', true);
  select dogdays.claim_legacy_data();
  commit;" | grep claimed)
expect_json "the claim moves the copied rows" \
  '{"drafts": 2, "claimed": true, "savedPlans": 2, "preferences": 1, "draftCourses": 2}' "$claimed"
expect "and leaves the other member's rows alone" 1 \
  "$(psql_dst -c "select count(*) from dogdays.\"userSavedPlans\" where \"legacyUserId\" = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and \"userId\" is null")"
expect "the claimed plan is now owned" '00000000-0000-4000-8000-0000000000e5' \
  "$(psql_dst -c "select \"userId\" from dogdays.\"userSavedPlans\" where id = '10000000-0000-4000-8000-000000000001'")"

echo "legacy-copy.test: all passed"
