# Workout Shell

## Purpose

This route is the container for the active workout. It loads the workout document, displays a shared header, and chooses which internal workout screen to render.

## Route

- `/#/workout/:workoutId`

## Responsibilities

- load the workout by route param
- redirect home if the workout id is missing or invalid
- keep the current workout subview in sync with store state
- render the shared back button and title
- send the user home once the workout has been completed and the store clears

## Subview Map

| Store view | Screen doc | Header title |
| --- | --- | --- |
| `block-list` | [Workout: Block List](workout-block-list.md) | `Workout` |
| `new-block` | [Workout: New Block](workout-new-block.md) | `New Block` |
| `exercise-select` | [Workout: Exercise Select](workout-exercise-select.md) | `Select Exercise` |
| `goal-setting` | [Workout: Goal Setting](workout-goal-setting.md) | `Set Goals` |
| `block-in-progress` | [Workout: Block In Progress](workout-block-in-progress.md) | `In Progress` |
| `block-finished` | [Workout: Block Finished](workout-block-finished.md) | `Block Done` |

## Loading Rules

- while loading, show a centered `Loading workout...`
- if the workout cannot be found, immediately redirect home
- once loaded, normalize notes to strings and enter `block-list`

## Header Behavior

### Back button visibility

- hidden on `block-list`
- shown on all other subviews except when the user is in a currently running block

### Back button rules

| From | Result |
| --- | --- |
| `block-list` | reset store and navigate home |
| `new-block` | go to block list, or remove the active block if it is still empty and planning |
| `exercise-select` | go to `new-block` |
| `goal-setting` | go to `exercise-select` |
| `block-in-progress` | only available if the active block is already marked finished |
| `block-finished` | go to `block-list` |

## Store Coupling

This screen is intentionally thin. It should not own workout business logic beyond:

- initial data load
- invalid-route redirect
- leave-workout navigation
- subview selection

All workout mutation logic belongs in the shared workout session state.

## Important Reimplementation Note

The current product uses one route plus stateful subviews instead of many nested routes. Rebuilding with more URLs is possible, but only if the rewrite still preserves the same invalid-state protection and back behavior.

## Related Docs

- [Data and State](../architecture/data-and-state.md)
- [Workout Session and Recovery](../features/workout-session-and-recovery.md)
