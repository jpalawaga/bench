# Workout Session and Recovery

## Overview

This feature governs how a workout is created, resumed, mutated, and completed.

## Session Lifecycle

### Start

- Starting a workout creates a new `Workout` with:
  - generated `id`
  - `status: "active"`
  - `startedAt: now`
  - `completedAt: null`
  - empty `notes`
  - empty `blocks`
- The app persists the workout immediately, then navigates to `/#/workout/:id`.

### Build

- The user adds one or more blocks.
- Each block starts in `planning`.
- A block may remain empty while the user is configuring it, but empty blocks can be removed.
- Every mutation to the active workout is persisted after the action completes.

### Run

- Starting a block changes its status to `in-progress`.
- The workout remains `active` until the user explicitly finishes the workout.
- The rest timer, active set highlight, and notes all operate within the current block.

### Finish block

- Finishing a block changes the block status to `finished`.
- The user is then routed to the block-finished screen to optionally save next-session targets.

### Finish workout

- Finishing the workout changes:
  - `status` from `active` to `completed`
  - `completedAt` to the current time
- The completed workout is saved.
- The in-memory session store is then cleared.
- The workout route observes that the store no longer has an active workout and sends the user back to home.

## Recovery Behavior

### Home-route crash recovery

- On app startup, if the current route is home, the app checks storage for a workout with `status: "active"`.
- If found, the app redirects to that workout route and replaces the history entry.
- If the user loads a non-home route directly, the recovery check does not redirect them elsewhere.

### Background persistence

- When the document becomes hidden, the app reads the active workout from the store and writes it to storage.
- This is a second line of defense beyond normal mutation-time saves.

## Workout Navigation Rules

The workout shell owns back navigation.

| Current view | Back result |
| --- | --- |
| `block-list` | leave workout and return home |
| `new-block` | return to block list, except remove the block if it is still empty and planning |
| `exercise-select` | return to new block |
| `goal-setting` | return to exercise select |
| `block-in-progress` | no back unless the current block is already marked finished |
| `block-finished` | return to block list |

## Current Behavioral Quirk To Preserve Or Revisit

Finished blocks are still reopenable from the block list. Reopening routes them into the same editor used for in-progress blocks, so the user can still change sets and notes on a finished block. The dedicated block-finished confirmation screen only appears immediately after the user taps Finish Block.

If a rewrite wants to change this, do it intentionally because it is part of current behavior.

## Related Docs

- [Workout Shell](../screens/workout-shell.md)
- [Workout: Block List](../screens/workout-block-list.md)
- [Workout: Block In Progress](../screens/workout-block-in-progress.md)
