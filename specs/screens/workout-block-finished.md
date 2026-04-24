# Workout: Block Finished

## Purpose

This screen appears immediately after the user finishes a block. It gives the user one last opportunity to save next-session targets for each exercise before moving on.

## Layout

- success header with `Block Complete!`
- subtitle listing the exercise names in the block
- one prompt card per exercise
- bottom actions:
  - `Continue Workout`
  - `Finish Workout`

## Per-Exercise Prompt Behavior

Each exercise starts collapsed.

### Collapsed state

- muted `For Next Time` eyebrow
- exercise name
- status text:
  - `Targets set` if saved targets already exist
  - `Set optional targets` otherwise
- chevron affordance
- subdued low-contrast surface instead of a heavy raised card

### Expanded state

- muted `For Next Time` eyebrow and exercise name
- editable rows matching the exercise's tracking mode:
  - strength exercises: reps, weight, and grouped count
  - cardio exercises: duration (seconds), level, and grouped count
- `+ Add Set` action
- per-row remove buttons when more than one row exists
- shared goal rows stay compact on narrow phones instead of wrapping into stacked multi-line rows
- when present, proposal badges are centered in the middle space before the remove button rather than trailing against it
- `Close` button
- `Save Targets` button

## Initial Values

The editable targets follow this precedence:

1. existing saved `nextSessionTargets`, if present
2. otherwise the sets just performed in the block

Consecutive identical targets or performed sets are grouped into one editable row with an `amount` count. Set count can change either through the per-row amount dropdown or by adding and removing rows.

## Save Behavior

- saving writes the edited grouped target rows to `BlockExercise.nextSessionTargets`, preserving `amount` values greater than `1`
- the prompt collapses after save
- the collapsed card shows the success state

Targets are optional. The user can ignore them and continue.

## Continue Actions

### Continue Workout

- return to `block-list`
- keep the workout active

### Finish Workout

- complete the whole workout immediately from this screen
- save `completedAt`
- clear the active session

## Reimplementation Notes

- this screen is not just confirmation; it is the only place the user can explicitly author next-session targets after finishing a block
- the expanded editor is shared with the pre-block goal-setting flow so both screens use the same grouped-count row model

## Related Docs

- [Workout: Block In Progress](workout-block-in-progress.md)
- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
