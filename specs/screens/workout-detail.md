# Workout Detail

## Purpose

This is the read-only detail view for one completed workout. It is entered from the log home screen without changing routes.

## Route Context

- rendered while the URL remains `/#/`
- presented as a full-screen state swap inside the log page

## Entry Rules

- only completed workouts open this screen
- active workouts resume directly into the workout shell instead

## Layout

### Header

- back button to return to the workout list
- workout date as the title
- duration on the right

### Main content

- empty state if the workout contains no blocks
- otherwise one raised card per block

### Footer actions

- `Copy Workout` for completed workouts
- `Delete Workout`

## Block Card Contents

Each block card may include:

- block label like `Block 2`
- one section per exercise
- no standalone workout-note or block-note summary text

Each exercise section shows:

- exercise name
- one row per set
- goal and actual summary in the exercise's tracking mode:
  - strength: `Goal: reps x weight -> actual reps x weight`
  - cardio: `Goal: duration·Llevel -> actual duration·Llevel`, with duration formatted as `Mm`, `Ss`, or `M:SS`
- optional working note for that exercise in that session

## Copy Workout Format

The clipboard export is deliberately compact:

- first line is the workout month and day
- each exercise becomes one text line
- supersets use box-drawing prefixes to preserve grouping
- each set is represented as a token that reflects the tracking mode:
  - strength sets render as `reps@weight`, for example `8@135`
  - cardio sets render as `duration@Llevel`, for example `10:00@L7`
- repeated identical set tokens inside one exercise line are compressed using `xN`

This format is meant for quick sharing rather than round-trippable import.

## Delete Flow

- the delete button delegates to the parent log screen
- deletion itself happens only after confirmation in a modal
- successful delete returns the user to the log list

## Related Docs

- [Log Home](log-home.md)
- [Backup, Restore, and Sharing](../features/backup-restore-and-sharing.md)
- [Log and Library Components](../components/log-and-library-components.md)
