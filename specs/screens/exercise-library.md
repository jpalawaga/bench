# Exercise Library

## Purpose

This route provides direct management of the exercise library outside an active workout.

## Route

- `/#/exercises`

## Layout

- standard page header with back button and title
- search input
- scrolling list of exercise cards

## Data Rules

- blank query loads the full exercise library sorted by name
- non-blank query runs a case-insensitive name search
- both seeded and custom exercises appear in the same list

## Row Contents

Each row may show:

- exercise name
- up to two lines of `formNotes` preview if notes exist
- trailing chevron

## Interactions

- back button returns home
- selecting a row opens that exercise's detail route

## Content States

- loading: centered `Loading...`
- empty result: centered `No exercises found.`

## Product Boundaries

- no create-exercise action lives on this screen
- custom exercise creation only exists inside the workout flow
- deleting or renaming exercises happens in exercise detail

## Related Docs

- [Exercise Detail](exercise-detail.md)
- [Log Home](log-home.md)
- [Log and Library Components](../components/log-and-library-components.md)
