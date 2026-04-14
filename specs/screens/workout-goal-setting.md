# Workout: Goal Setting

## Purpose

This screen converts a selected exercise into a planned `BlockExercise` with one or more goal rows.

## Layout

- exercise name as the section heading
- one editable row per grouped goal
- `+ Add Set` text action
- bottom `Lock In` button

## Row Structure

Each row contains:

- set label like `S1`, or a range like `S1-3` when the row count is greater than one
- reps numeric input
- weight numeric input
- grouped-count dropdown so the row can represent multiple consecutive sets such as `x3`
- optional proposal badge
- optional remove button when more than one row exists
- the row stays compact on narrow phones; badge and control sizing should tighten before the row is allowed to wrap
- when shown, the proposal badge is visually centered between the numeric editors and the remove button

Set labels are derived from cumulative grouped order and cannot be edited directly.

## Initialization Algorithm

When the screen opens for a pending exercise:

1. load saved next-session targets
2. if none exist, load last actual performed sets
3. if neither exists, start with one blank row

Proposed rows are visually labeled:

- `PLANNED` for saved next-session targets
- `PREV` for last-actual suggestions

If saved targets or previous actuals contain consecutive identical sets, the editor groups them into one row with the matching `amount`.

## Editing Rules

- changing reps, weight, or amount clears the proposed state for that row
- `Add Set` duplicates the previous row's reps and weight but resets the new row's amount to `1`
- removing a row reindexes visible set numbers and ranges based on cumulative grouped counts
- set count can change either by editing the per-row amount dropdown or by adding and removing rows

## Lock In Behavior

On `Lock In`:

1. expand grouped rows into individual `ExerciseSet` records
2. persist each set goal with `amount = 1`
3. assign sequential `setNumber` values across the set list
4. create a `BlockExercise` with empty notes
5. append it to the active block
6. return to `new-block`

## Loading State

- centered `Loading...` until the initialization query resolves

## Reimplementation Notes

- goal rows allow zero values in the underlying model, but the UI presents them like blank numeric inputs
- this editor is shared with the next-session target flow so both contexts use the same grouped-count editing behavior

## Related Docs

- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Workout Components](../components/workout-components.md)
- [Data and State](../architecture/data-and-state.md)
