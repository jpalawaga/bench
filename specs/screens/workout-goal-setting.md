# Workout: Goal Setting

## Purpose

This screen converts a selected exercise into a planned `BlockExercise` with one or more goal rows.

## Layout

- exercise name as the section heading
- one editable row per planned set group
- `+ Add Set` text action
- bottom `Lock In` button

## Row Structure

Each row contains:

- set label like `S1`
- reps numeric input
- weight numeric input
- amount select from `x1` through `x8`
- optional proposal badge
- optional remove button when more than one row exists

Rows represent grouped goals, not always one physical set. `amount` expands later.

## Initialization Algorithm

When the screen opens for a pending exercise:

1. load saved next-session targets
2. if none exist, load last actual performed sets
3. if neither exists, start with one blank row

Proposed rows are visually labeled:

- `PLANNED` for saved next-session targets
- `PREV` for last-actual suggestions

## Editing Rules

- changing reps or weight clears the proposed state for that row
- changing amount also clears the proposed state for that row
- `Add Set` duplicates the previous row's values but clears proposal metadata
- removing a row reindexes visible set numbers

## Lock In Behavior

On `Lock In`:

1. expand each grouped row by its `amount`
2. convert the grouped rows into individual `ExerciseSet` records
3. reset each expanded set's `goal.amount` to `1`
4. assign sequential `setNumber` values across the expanded list
5. create a `BlockExercise` with empty notes
6. append it to the active block
7. return to `new-block`

## Loading State

- centered `Loading...` until the initialization query resolves

## Reimplementation Notes

- goal rows allow zero values in the underlying model, but the UI presents them like blank numeric inputs
- grouped-set editing and per-set storage are both required; a faithful rebuild should not collapse to only one representation

## Related Docs

- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Workout Components](../components/workout-components.md)
- [Data and State](../architecture/data-and-state.md)
