#!/usr/bin/env bash
# Generate the TypeScript types (the file devtools.config.json names as
# `types.out`) from the running local stack.
#
# The output is exactly `supabase gen types typescript` for the product's
# schemas, with no header: CI compares and uploads it as it is, so the same
# schema always gives the same bytes. (`devtools db types` writes the same body
# under a one-line `@generated` comment on a contributor's machine.)
set -euo pipefail

supabase=${SUPABASE:-supabase}
out=$(node -p "require('./devtools.config.json').types.out")
schemas=$(node -p "require('./devtools.config.json').supabase.schemas.join(',')")

rm -f "$out"
mkdir -p "$(dirname "$out")"
"$supabase" gen types typescript --local --schema "$schemas" >"$out"
test -s "$out" || { echo "supabase gen types wrote nothing to $out." >&2; exit 1; }
