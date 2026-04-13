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

- exercise name
- status text:
  - `Targets set` if saved targets already exist
  - `Set optional targets` otherwise
- chevron affordance

### Expanded state

- editable rows for reps, weight, and amount
- `Close` button
- `Save Targets` button

## Initial Values

The editable targets follow this precedence:

1. existing saved `nextSessionTargets`, if present
2. otherwise the sets just performed in the block

Both sources are normalized into grouped consecutive goal rows so repeated identical sets can be represented with `amount > 1`.

## Save Behavior

- saving writes the grouped target rows to `BlockExercise.nextSessionTargets`
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

- this screen is not just confirmation; it is the only place the user can explicitly author grouped next-session targets
- targets are stored without row ids because they are grouped planning data, not concrete logged sets

## Related Docs

- [Workout: Block In Progress](workout-block-in-progress.md)
- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
