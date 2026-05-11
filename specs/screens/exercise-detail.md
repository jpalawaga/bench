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

### Next Targets card

- shows the targets planned for the next time this exercise is added to a workout
- exercise-level targets are shown first; if none exist, the screen falls back to the latest historical workout-embedded `nextSessionTargets` for this exercise and tracking mode
- when targets exist, the collapsed card shows one row per grouped target with set labels like `S1` or `S1-3` and mode-aware goal text
- when no targets exist, the card shows `No targets set.`
- `Configure` opens the grouped target editor when no targets exist
- `Edit` opens the grouped target editor when targets exist
- editing uses the same mode-aware rows as workout goal planning:
  - strength rows edit reps, weight, and grouped count
  - cardio rows edit seconds, level, and grouped count
- `Save Targets` writes grouped rows to `Exercise.nextSessionTargets`
- `Cancel` exits editing without writing
- `Clear Targets` removes exercise-level targets and returns to the no-targets state

### History section

- zero-state card when no history exists
- otherwise one card per history entry

## Save Semantics

There is no explicit save button.

When the user goes back:

- if there are unsaved changes and the trimmed name is non-empty, save automatically
- if the trimmed name is empty, do not save and just navigate back

Changes are detected by comparing trimmed field values against the originally loaded exercise.

Target editing uses explicit actions and is independent of the back-button auto-save. Saving or clearing targets also persists the current non-empty name and trimmed guidance note so local edits are not lost.

## Delete Semantics

- delete uses a destructive confirmation modal
- deleting removes the exercise from the exercise library table
- historical workouts are not rewritten, so past logs still show the exercise name stored in those workouts

## History Card Contents

Each history card can include:

- workout start date and time
- superset label if the exercise was part of a multi-exercise block
- comma-separated superset partner names
- compact set summary in the exercise's tracking mode:
  - strength entries render as `reps x weight` per set, using the actual values and substituting `—` for any blank metric
  - cardio entries render as `duration·Llevel` per set, again substituting `—` when a metric is blank
- per-session working note text if it exists

## Editing Constraints

- blank names are not accepted for save
- `formNotes` is optional and is trimmed before save

## Related Docs

- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Notes](../features/notes.md)
- [Exercise Library](exercise-library.md)
