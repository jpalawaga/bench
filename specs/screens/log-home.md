# Log Home

## Purpose

This is the main entry point for the app. It does four jobs:

- show workout history
- start a new workout
- resume an active workout
- expose hidden utility actions such as build info and backup

## Route

- `/#/`

## Layout

### Header

- left: `Benchpress` title
- optional build metadata stacked beside the title
- right: icon button that opens the exercise library

### Primary action

- full-width `Start New Workout` button directly below the header

### Main content

- workout list area
- loading state, empty state, or one row per workout

## Data Requirements

- list of all workouts ordered newest first
- whether a selected workout detail overlay is open
- whether the delete confirmation is open
- whether the backup modal is open

## Primary Interactions

### Start new workout

- creates a new active workout immediately
- persists it before navigation
- navigates to the workout shell route

### Workout list item

- active workout: resume the workout route
- completed workout: open the read-only workout detail screen

### Exercise library shortcut

- opens `/#/exercises`

## Hidden Interactions

### Title tap

- toggles a small build label showing version and UTC build timestamp

### Title long press

- after about 700ms, opens the backup and restore modal
- suppresses the normal click that would have toggled build metadata

## Content States

### Loading

- centered `Loading...`

### Empty

- centered message inviting the user to start their first workout

### Populated

- one row per workout using a compact summary: date, duration, and a short exercise list

## Detail Overlay Relationship

Selecting a completed workout does not change the route. Instead, home swaps into a full-screen detail state for that workout. See [Workout Detail](workout-detail.md).

## Delete Flow

- delete is initiated from the workout detail screen
- confirmation uses a destructive modal
- confirming delete removes the workout, clears the current selection, and refreshes the history list

## Post-Restore Behavior

When a database import succeeds:

- the active workout store is reset
- any selected workout detail state is cleared
- the backup modal closes
- the workout list reloads from storage

## Related Docs

- [Backup, Restore, and Sharing](../features/backup-restore-and-sharing.md)
- [Workout Detail](workout-detail.md)
- [Log and Library Components](../components/log-and-library-components.md)
- [Workout Session and Recovery](../features/workout-session-and-recovery.md)
