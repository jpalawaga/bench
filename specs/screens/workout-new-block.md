# Workout: New Block

## Purpose

This subview configures one block before the user starts it.

## Layout

### Primary action

- button label is `Add Exercise` when the block is empty
- button label becomes `Create Superset` once at least one exercise exists

### Exercise list

- empty state when no exercises have been added
- otherwise one card per exercise in the block

### Footer controls

- rest timer slider
- `Start Block` button

## Block Model Assumption

A block is:

- a single exercise when it has one `BlockExercise`
- a superset when it has multiple `BlockExercise` records

The UI does not ask the user to name or classify the block separately.

## Interactions

### Add Exercise / Create Superset

- navigates to `exercise-select`

### Remove exercise

- each exercise card has a remove affordance
- removing an exercise immediately persists the block change

### Configure rest timer

- uses a dedicated slider with snap points between off and 5 minutes
- stores the timer on the block as seconds or `null` when off

### Start Block

- disabled until the block contains at least one exercise
- changes the block status to `in-progress`
- selects the first incomplete set in the first exercise
- moves to `block-in-progress`

## Exercise Card Behavior

- exercise cards show exercise name and a compact goal summary
- card taps are currently a no-op
- remove is the only active per-card action on this screen

## Empty-State Back Behavior

If the user backs out of a just-created block while it is still:

- `planning`
- empty

the workout shell deletes the block instead of leaving behind an empty draft.

## Related Docs

- [Workout: Exercise Select](workout-exercise-select.md)
- [Workout: Block In Progress](workout-block-in-progress.md)
- [Workout Components](../components/workout-components.md)
