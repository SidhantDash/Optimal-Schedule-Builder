---
name: Where things live
description: '"I want to change X" — a path table for the parts of this app you''ll actually touch.'
order: 19
section: guides
---

# Where things live

| I want to change...                         | Path                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| A page or route                             | `src/app/<route>/` (Next app router)                                        |
| A UI component                              | `src/components/`                                                           |
| Course Search and By Subject                | `src/components/courses/search/`                                            |
| The section picker                          | `src/components/courses/CourseSectionsDialog.tsx`                           |
| Schedule display UI                         | `src/components/schedules/`                                                 |
| Saved plans UI                              | `src/components/saved-plans/`, `src/components/plans/`                      |
| The footer and its links                    | `src/components/Footer.tsx`                                                 |
| A hook that reads the catalog               | `src/hooks/queries/`, see [the catalog](./catalog.md)                       |
| A hook that reads or writes member data     | `src/hooks/data/`                                                           |
| A server action                             | `src/server/actions/`                                                       |
| The catalog client                          | `src/catalog/`                                                              |
| Shared domain types (Section, Meeting, …)   | `src/lib/domain/`                                                           |
| The generation engine itself                | `src/lib/generation/engine.ts`                                              |
| A new schedule generation rule              | `src/lib/generation/rules/`, registered in `src/lib/generation/registry.ts` |
| The `.dogdays.json` plan file               | `src/lib/planFile/`                                                         |
| Tables, columns, policies                   | `supabase/schemas/`, see [the database](./schema.md)                        |
| Sign-in / auth gating                       | `src/lib/signIn.ts`, `src/app/(api)/auth/callback/`, `src/middleware.ts`     |
| Merging a signed-out visitor's local drafts | `src/lib/sync/mergeLocalData.ts`                                            |
| Anything kept in `localStorage`             | `src/lib/localStorage/`                                                     |
| Sentry and the Feedback widget (browser)    | `src/instrumentation-client.ts`                                             |
| The Worker entry (server Sentry)            | `cloudflare/worker.ts`                                                      |
| Workers config and bindings                 | `wrangler.jsonc`                                                            |
| Env contract                                | `src/env.ts` and `.env.example`                                             |

See [Schedule generation](./generation.md) for how the generation path works,
not just where it lives.
