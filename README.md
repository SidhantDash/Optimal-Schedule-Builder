# DogDays

[DogDays](https://dogdays.dev) is a course schedule builder for UGA students.
You pick the courses you want, and it finds every conflict-free combination of
sections against real registrar data, ranked by your preferences. It is built
and run by [DevDogs at UGA](https://devdogsuga.org), a student club, and every
feature here is written by club members.

The repository began as the 2024-25 Optimal Schedule Builder project. That
code (a Java backend and a React frontend) is gone from the working tree and
stays in the git history, so its contributors stay credited. The app you see
now is the 2026 rebuild: Next.js on Cloudflare Workers, with its own Supabase
project for user data.

## Contribute

Pick an issue from the [milestones](https://github.com/DevDogsUGA/DogDays/milestones).
Issues labelled [`good first issue`](https://github.com/DevDogsUGA/DogDays/labels/good%20first%20issue)
take under an hour, name the file to change, and say how to check the result.
[CONTRIBUTING.md](CONTRIBUTING.md) covers the pull request flow, and
[docs/](docs/index.md) explains how the app is put together.

> [!NOTE]
> The setup docs are being rewritten for this standalone repository, so some
> pages under `docs/` still describe the old monorepo. If something does not
> match what you see, ask in the club Discord (the link is in CONTRIBUTING.md).

## Roadmap

Dates are targets for the fall 2026 semester. The work is split into one
[GitHub milestone](https://github.com/DevDogsUGA/DogDays/milestones) per
feature.

| Date | What |
| --- | --- |
| Thu Nov 12 | **Beta.** DogDays is trustworthy enough to plan Spring 2027 registration on. Ticketed registration opens. |
| Wed Nov 18 | **Demo Day, and the feature freeze.** After it, only bug fixes go in through Nov 23. |
| Mon Nov 23 | Hard date for Beta: open registration. |
| Wed Dec 2 | **Complete.** Leadership Transition Day: the future milestones reviewed, a runbook for the scrape, the Fall 2027 term rollover, Sentry and deploys, and a handoff to the spring focus lead and the new DevOps officer. |

### Milestones

| Milestone | Due | What it delivers |
| --- | --- | --- |
| [Accessibility & Polish](https://github.com/DevDogsUGA/DogDays/milestones) | Rolling | Small first-PR fixes: labels, empty states, copy, keyboard navigation, page titles, print styles. At least four open at all times. |
| [Data Spot-Checks](https://github.com/DevDogsUGA/DogDays/milestones) | Nov 6 | Batches of 15 Spring 2027 CRNs checked against Athena (time, days, room, instructor, part of term), with a bug filed for every mismatch. Two rounds: the weeks of Oct 26 and Nov 2. |
| [Time Between Classes](https://github.com/DevDogsUGA/DogDays/milestones) | Nov 9 | A minimum and maximum gap between same-day classes. The minimum is a hard rule; the maximum is a soft preference, closest first. Plus a Filters UI. |
| [Plan Sharing](https://github.com/DevDogsUGA/DogDays/milestones) | Nov 9 | A signed-in student makes a live read-only link to a saved plan, and viewers can copy it into their own plans. |
| [Import/Export](https://github.com/DevDogsUGA/DogDays/milestones) | Nov 9 | A versioned `.dogdays.json` plan file with a validated import, and a one-way `.ics` calendar export. |
| [Map of Classes](https://github.com/DevDogsUGA/DogDays/milestones) | Nov 18 (stretch) | Day tabs under a plan with a Google map, pins numbered in class order, and a popup with course, time, building and room. |

Future work, described but not yet sliced into issues:
Max Distance, Manual Entry, Past Credits, Prerequisites, Onboarding and
Settings. They get issues when a spring group picks them up. Seat refresh is
not on the list: UGA's policies and public data do not allow it.

## How it is built

- **App.** Next.js on Cloudflare Workers (through vinext), in `src/`. The
  schedule engine is a rule-based search in `src/lib/generation/`.
- **Course data.** DogDays does not scrape the registrar. It is moving to
  read UGA's course catalog from DevDogs' public, read-only catalog API.
- **User data.** Saved plans and preferences are moving to DogDays' own
  Supabase project. The schema is declarative: contributors edit
  `supabase/schemas/*.sql` and write an RLS test for the allow and the deny.
  There are no hand-written migrations, and the generated TypeScript types are
  never committed (`devtools db types`, or `--download` to skip Docker).
- **Checks.** Every pull request runs `validate` (workflow lint, Markdown
  links, `.env.example` is public-only) and `database` (the schema applies,
  the RLS suite passes, the types generate and are diffed against `main`),
  plus the destructive-SQL gate.

The repository is licensed under the [BSD 3-Clause License](LICENSE).
