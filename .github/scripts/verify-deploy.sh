#!/usr/bin/env bash
# What a deployed DogDays database must do for a visitor who is not signed in
# (the staging deploy runs this against the project it just changed):
#
#   - PostgREST serves the `dogdays` schema (the publishable key is accepted;
#     a schema it does not serve answers 406, so 200 means it does),
#   - a signed-out request for a user table gets an error, never rows,
#   - the claim function is not callable without a session,
#   - nothing else is exposed: `public` is not a served schema.
#
# Environment: API_URL (https://<ref>.supabase.co), PUBLISHABLE_KEY.
set -euo pipefail

: "${API_URL:?API_URL is required}"
: "${PUBLISHABLE_KEY:?PUBLISHABLE_KEY is required}"
api=${API_URL%/}
fail() { echo "verify-deploy: $*" >&2; exit 1; }
status() { # status <profile> <method> <path> [body]
  curl -s -o /tmp/verify-body -w '%{http_code}' -X "$2" \
    -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $PUBLISHABLE_KEY" \
    -H "Accept-Profile: $1" -H "Content-Profile: $1" -H 'Content-Type: application/json' \
    ${4:+--data "$4"} "$api/rest/v1/$3"
}

# PostgREST needs a moment to reload its schema cache after a change.
for attempt in 1 2 3 4 5 6; do
  code=$(status dogdays GET '')
  [ "$code" = 200 ] && break
  echo "verify-deploy: the API answered $code, waiting (attempt $attempt)"
  sleep 10
done
[ "$code" = 200 ] || fail "the API does not serve the dogdays schema ($code): $(head -c 300 /tmp/verify-body)"
# A schema PostgREST does not serve answers 406; one it does answers 200 even
# though the signed-out role may see none of its tables.
code=$(status not_a_schema GET '')
[ "$code" = 406 ] || fail "a schema that does not exist answered $code, not 406: the check above proves nothing"
echo "ok - the API serves the dogdays schema"

for table in userSavedPlans userPreferences userPlanDrafts userPlanDraftCourses legacyImports; do
  code=$(status dogdays GET "$table?select=*&limit=1")
  case "$code" in 401 | 403) ;; *) fail "a signed-out GET of $table answered $code, not 401/403: $(head -c 300 /tmp/verify-body)" ;; esac
done
echo "ok - a signed-out visitor is refused on every table"

code=$(status dogdays POST rpc/claim_legacy_data '{}')
case "$code" in 401 | 403) ;; *) fail "a signed-out call of claim_legacy_data answered $code, not 401/403: $(head -c 300 /tmp/verify-body)" ;; esac
echo "ok - claim_legacy_data needs a session"

code=$(status public GET '')
case "$code" in 406 | 404 | 400) echo "ok - public is not a served schema" ;; *) fail "the public schema answered $code; only dogdays should be served" ;; esac
