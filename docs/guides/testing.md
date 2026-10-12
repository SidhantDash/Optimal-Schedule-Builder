---
name: Testing
description: The suites this app runs, and what CI checks on your pull request.
order: 21
section: guides
---

# Testing

```bash
pnpm test             # Vitest: unit and component tests, no database, no network
pnpm lint             # ESLint
pnpm typecheck        # tsc, for the app and for the Worker entry
pnpm format:check     # Prettier
pnpm devtools supabase test db   # the RLS suite (needs a local database)
```

`pnpm test` needs nothing running. Tests that touch the catalog mock the client
(see `src/lib/domain/catalogSections.test.ts`), so they pass offline.

## The RLS suite

`supabase/tests/dogdays_rls.test.sql` is pgTAP. It signs in as different
members and asserts who can read and write which rows. If you change
`supabase/schemas/`, add the allow and the deny for it there.

## `contract/`

`contract/` has its own tiny package and runs against the real staging catalog.
It is how a change in the catalog's responses is noticed here before a member
notices it.

## Run the production build

`pnpm preview` builds the app with vinext and serves it on `workerd`, the same
runtime as production, which behaves differently from `pnpm dev` in places
(request-scoped storage, the Cache API). Run it before a pull request that
touches `cloudflare/`, `middleware.ts` or caching.

After editing a binding in `wrangler.jsonc`, run `pnpm types:cf` and commit the
diff; CI fails on drift.

## What CI runs on a pull request

| Check | What it runs |
| --- | --- |
| `validate` | workflow lint, Markdown links, `.env.example` has no secrets, the script tests |
| `app` | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, with no secrets (a fork's pull request passes) |
| `contract` | the catalog contract tests |
| `database` | the schema applies, the RLS suite passes, the types generate and are diffed against `main` |
| `destructive-gate` | the SQL your change runs, and the gate on data-dropping changes |
