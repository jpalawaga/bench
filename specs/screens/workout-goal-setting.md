# Workout: Goal Setting

## Purpose

This screen converts a selected exercise into a planned `BlockExercise` with one or more goal rows.

## Layout

- exercise name as the section heading
- one editable row per grouped goal
- `+ Add Set` text action
- bottom `Lock In` button

## Row Structure

The row's two numeric inputs are determined by the selected exercise's `trackingMode`. The grouped-count dropdown, proposal badge, and remove button behave identically in both modes.

Strength exercises (`trackingMode: "strength"`):

- set label like `S1`, or a range like `S1-3` when the row count is greater than one
- reps numeric input
- weight numeric input (pounds)
- grouped-count dropdown so the row can represent multiple consecutive sets such as `x3`
- optional proposal badge
- optional remove button when more than one row exists

Cardio exercises (`trackingMode: "cardio"`):

- set label like `S1`, or a range like `S1-3`
- duration numeric input, labeled `sec`
- level numeric input, labeled `lvl`, separated from the duration input with `@` rather than `x`
- grouped-count dropdown
- optional proposal badge
- optional remove button when more than one row exists

Shared row constraints:

- the row stays compact on narrow phones; badge and control sizing should tighten before the row is allowed to wrap
- when shown, the proposal badge is visually centered between the numeric editors and the remove button

Set labels are derived from cumulative grouped order and cannot be edited directly.

## Entry Modes

The goal-setting screen handles two flows:

- **add mode**: entered from the exercise selector; the exercise is new to the current block
- **edit mode**: entered by tapping an already-configured exercise card on the new-block screen; the same exercise stays in place and only its sets are rewritten

The two modes share one editor. The only differences are how the rows are seeded and how the screen commits changes.

## Initialization Algorithm

### Seeding in add mode

When the screen opens for a newly selected exercise:

1. load saved next-session targets for that exercise, restricted to its current tracking mode
2. if none exist, load last actual performed sets for that exercise, restricted to its current tracking mode
3. if neither exists, start with one blank row in the exercise's current tracking mode

Historical entries that do not match the current mode are ignored so that a mode change does not leak stale metrics from the previous mode.

### Seeding in edit mode

When the screen opens to edit an exercise already in the current block, seeding ignores history entirely and derives rows from the existing configured sets. Consecutive identical sets collapse into a single grouped row with the matching `amount`. No proposal badges are shown because these values were already committed by the user.

Proposed rows are visually labeled:

- `PLANNED` for saved next-session targets
- `PREV` for last-actual suggestions

If saved targets or previous actuals contain consecutive identical sets, the editor groups them into one row with the matching `amount`.

## Editing Rules

- changing any metric field or the amount clears the proposed state for that row
- `Add Set` duplicates the previous row's metrics in the same mode but resets the new row's amount to `1`
- removing a row reindexes visible set numbers and ranges based on cumulative grouped counts
- set count can change either by editing the per-row amount dropdown or by adding and removing rows
- the mode of a row is fixed by the selected exercise; the editor does not expose mode switching inline

## Commit Behavior

The commit button reads `Lock In` in add mode and `Save` in edit mode.

### Committing in add mode

On commit:

1. expand grouped rows into individual `ExerciseSet` records
2. persist each set goal with `amount = 1`
3. assign sequential `setNumber` values across the set list
4. create a `BlockExercise` with empty notes
5. append it to the active block
6. return to `new-block`

### Committing in edit mode

On commit:

1. expand grouped rows into individual `ExerciseSet` records
2. replace the existing exercise's `sets` with the expanded list and fresh actuals in the exercise's tracking mode
3. preserve the `BlockExercise`'s `id`, `exerciseId`, `exerciseName`, `notes`, and `nextSessionTargets`
4. return to `new-block`

Backing out of the goal editor while in edit mode cancels the pending change and returns to `new-block` without writing.

## Loading State

- centered `Loading...` until the initialization query resolves

## Reimplementation Notes

- goal rows allow zero values in the underlying model, but the UI presents them like blank numeric inputs
- this editor is shared with the next-session target flow so both contexts use the same grouped-count editing behavior

## Related Docs

- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Workout Components](../components/workout-components.md)
- [Data and State](../architecture/data-and-state.md)
