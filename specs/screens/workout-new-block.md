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
- up to two superset suggestion cards appear below the configured exercises when historical superset data exists

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

## Superset Suggestions

When the block already contains at least one exercise, the screen shows up to two suggestion cards rendered directly below the configured exercise cards.

### Selection algorithm

- scan completed workouts only
- consider finished blocks that contain more than one exercise
- a block contributes when any of its exercises matches one of the current block's exercises
- every other exercise in that block gets a co-occurrence point per appearance
- exercises already in the current block are excluded from suggestions
- sort candidates by descending co-occurrence count and take the top two
- if no historical co-occurrence data is available the section is empty

### Card appearance

- same card silhouette as a configured exercise card so the list reads as one continuous stack
- muted presentation: dashed border, softened surface, reduced-contrast exercise name and muscle group
- a right-aligned pill labeled `Add to block` rendered in near-white text acts as the call to action
- no remove affordance
- there is no goal summary because the exercise has not yet been planned

### Tap behavior

- tapping a suggestion card is equivalent to picking that exercise from the exercise selector
- it sets the pending exercise context (including the exercise's tracking mode) and moves directly to `goal-setting`
- the user never passes through `exercise-select` when using a suggestion

## Empty-State Back Behavior

If the user backs out of a just-created block while it is still:

- `planning`
- empty

the workout shell deletes the block instead of leaving behind an empty draft.

## Related Docs

- [Workout: Exercise Select](workout-exercise-select.md)
- [Workout: Block In Progress](workout-block-in-progress.md)
- [Workout Components](../components/workout-components.md)
