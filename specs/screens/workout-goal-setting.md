# Workout: Goal Setting

## Purpose

This screen converts a selected exercise into a planned `BlockExercise` with one or more goal rows.

## Layout

- exercise name as the section heading
- one editable row per planned set
- `+ Add Set` text action
- bottom `Lock In` button

## Row Structure

Each row contains:

- set label like `S1`
- reps numeric input
- weight numeric input
- optional proposal badge
- optional remove button when more than one row exists
- the row stays compact on narrow phones; badge and control sizing should tighten before the row is allowed to wrap

Set numbers are derived from row order and cannot be edited directly.

## Initialization Algorithm

When the screen opens for a pending exercise:

1. load saved next-session targets
2. if none exist, load last actual performed sets
3. if neither exists, start with one blank row

Proposed rows are visually labeled:

- `PLANNED` for saved next-session targets
- `PREV` for last-actual suggestions

If a saved target was stored with grouped count shorthand, it is expanded into one row per set before rendering.

## Editing Rules

- changing reps or weight clears the proposed state for that row
- `Add Set` duplicates the previous row's values but clears proposal metadata
- removing a row reindexes visible set numbers
- set count changes only through add/remove row actions

## Lock In Behavior

On `Lock In`:

1. convert the rows into individual `ExerciseSet` records
2. persist each set goal with `amount = 1`
3. assign sequential `setNumber` values across the set list
4. create a `BlockExercise` with empty notes
5. append it to the active block
6. return to `new-block`

## Loading State

- centered `Loading...` until the initialization query resolves

## Reimplementation Notes

- goal rows allow zero values in the underlying model, but the UI presents them like blank numeric inputs
- this editor is shared with the next-session target flow so both contexts use the same add/remove-row behavior

## Related Docs

- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Workout Components](../components/workout-components.md)
- [Data and State](../architecture/data-and-state.md)
