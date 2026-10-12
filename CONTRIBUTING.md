# Contributing to DogDays

Start with the [milestones](https://github.com/DevDogsUGA/DogDays/milestones)
and pick an issue. `good first issue` ones take under an hour.

## Before you open a pull request

- Keep it small and focused on one change. Link the issue it closes.
- Commit messages read `type(scope): subject`, for example
  `fix(navbar): label the account menu`.
- Tests pass locally, and changed behavior means changed docs.
- A table, column or policy change is an edit to `supabase/schemas/*.sql`, with an
  RLS test that asserts the allow **and** the deny. Do not write a migration for it.
- Never put a secret in the repository or `.env.example`. `.env.example` is
  copied into every contributor's `.env`.

## Review

Pull requests need one approval from the code owners in
[`.github/CODEOWNERS`](.github/CODEOWNERS): the DogDays leads for the app, and
DevOps for workflows and anything under `supabase/`. Merges are squash merges
through the merge queue.

## Checks

| Check | Meaning |
| --- | --- |
| `validate` | workflow lint, Markdown links, `.env.example` is public-only |
| `database` | the schema tree applies, the RLS suite passes, the types generate and are diffed against `main` |
| `destructive-gate / ...` | the SQL your change runs, and the gate on data-dropping changes |

Stuck, or something is wrong with the docs? Ask in the club Discord
(<https://devdogsuga.org/discord>).
