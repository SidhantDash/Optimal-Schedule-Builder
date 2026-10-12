---
name: Set up and run DogDays
description: From a fork to a running app. Hosted database by default; Docker is optional.
order: 1
section: getting-started
---

# Set up and run DogDays

Plan on about fifteen minutes. You need a GitHub account, plus a free Supabase
account if you use the hosted database (the default). The course data is public,
so it needs no key.

## What you need

- **Git** and a GitHub account.
- **A free [Supabase](https://supabase.com) account**, unless you use Docker.
  Setup asks for the project's URL, its publishable and secret keys, and its
  session-pooler connection string, and tells you where to find each.
- **Node.js 22.12 or newer** (24 is what CI uses; `.nvmrc` says 24).
- **pnpm 11** (`corepack enable` picks the right one from `package.json`).
- **Docker**, only if you want the database on your own machine. The default is
  a free hosted Supabase project, which needs no Docker.

## Steps

1. Fork [DevDogsUGA/DogDays](https://github.com/DevDogsUGA/DogDays) and clone
   your fork.
2. Install the dependencies:

   ```bash
   pnpm install
   ```

3. Let the setup command check your machine and write your `.env`:

   ```bash
   pnpm devtools setup
   ```

   It asks whether to use a hosted Supabase project (the default; it tells you
   what to click) or a local one in Docker, checks the prerequisites above,
   writes `.env` from `.env.example`, applies `supabase/schemas/` to your
   database, and registers "Sign in with DevDogs" for it. Your secrets go in
   `.env.tooling`, which git ignores; `.env` holds only public values.

4. Start the app:

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000>. Courses come from the public staging catalog,
   so search works straight away. Sign in with your DevDogs account to try saving
   a plan.

## When something is off

- `pnpm devtools doctor` checks the machine against what the repository needs.
- The TypeScript types for your database are generated and never committed. If
  `pnpm typecheck` complains about `database.types.ts`, run
  `pnpm devtools db types` (or `pnpm devtools db types --download` to skip Docker).
- Stuck anyway? Ask in the club Discord (the link is in
  [CONTRIBUTING.md](../../CONTRIBUTING.md)). A setup that does not work is a bug
  in these docs; tell us.

## Next

[Your first contribution](./first-contribution.md), then
[Where things live](../guides/where-things-live.md).
