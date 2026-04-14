# Exercise Detail

## Purpose

This screen edits one exercise library record and shows historical usage for that exercise.

## Route

- `/#/exercises/:exerciseId`

## Loading Rules

- load the exercise record and its history in parallel
- if the exercise does not exist, redirect back to the library using replace navigation
- show centered `Loading exercise...` until ready

## Layout

### Header

- back button
- title `Edit Exercise`
- delete button

### Editable card

- `Name` field
- `Notes` textarea for exercise guidance notes attached to the exercise as a whole
- this guidance note can also be edited inline from the in-progress block screen

### History section

- zero-state card when no history exists
- otherwise one card per history entry

## Save Semantics

There is no explicit save button.

When the user goes back:

- if there are unsaved changes and the trimmed name is non-empty, save automatically
- if the trimmed name is empty, do not save and just navigate back

Changes are detected by comparing trimmed field values against the originally loaded exercise.

## Delete Semantics

- delete uses a destructive confirmation modal
- deleting removes the exercise from the exercise library table
- historical workouts are not rewritten, so past logs still show the exercise name stored in those workouts

## History Card Contents

Each history card can include:

- workout start date and time
- superset label if the exercise was part of a multi-exercise block
- comma-separated superset partner names
- compact set summary using actual values, falling back to goals if actuals are blank
- per-session working note text if it exists

## Editing Constraints

- blank names are not accepted for save
- `formNotes` is optional and is trimmed before save

## Related Docs

- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Notes](../features/notes.md)
- [Exercise Library](exercise-library.md)
