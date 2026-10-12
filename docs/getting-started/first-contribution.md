---
name: Your first contribution
description: The flow from an issue to a merged pull request, with one small change to try.
order: 3
section: getting-started
---

# Your first contribution

## The flow

1. Pick an issue labelled
   [`good first issue`](https://github.com/DevDogsUGA/DogDays/labels/good%20first%20issue).
   It names the file to change and says how to check the result. Comment that
   you are taking it.
2. [Set up the app](./setup.md) and make a branch in your fork.
3. Change the one thing. Run `pnpm test`, `pnpm lint` and `pnpm typecheck`.
4. Open a pull request using the template and link the issue. CI runs without
   any secrets, so it works from a fork.
5. A code owner reviews it. Fix what they ask, and a squash merge lands it.

[CONTRIBUTING.md](../../CONTRIBUTING.md) has the rules for commit messages and
reviews.

## A change to try

Course Search ends in a list of courses, and each one opens a section picker
(`src/components/courses/CourseSectionsDialog.tsx`). The catalog marks cancelled
sections but keeps them (see [the catalog](../guides/catalog.md)), so a student
can leave a dead section checked and only learn that when a schedule fails to
build.

The picker's rows come from `useSectionsByCourse` (`src/hooks/queries/useSectionsByCourse.ts`),
which already returns `cancelled` for each section, and are drawn by
`SectionExclusionList.tsx`. Add a "Cancelled" badge to a row, and check it:

- Add a component test beside `SectionExclusionList.tsx` that renders one
  cancelled and one open section and expects the badge on the first only.
- Run `pnpm test`.
- Run `pnpm dev`, search for a course, open it, and look at the picker.

Everything you need is in those two files, and nothing in this change needs a
database.
