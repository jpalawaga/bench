# Backup, Restore, and Sharing

## Overview

Benchpress hides its advanced data tools behind gestures instead of giving them dedicated navigation.

This feature area covers:

- full database export
- full database restore
- workout text export to clipboard
- clipboard helpers around backup JSON

## Backup Access

- The log screen title is interactive.
- A normal tap toggles build metadata visibility.
- A long press of about 700ms opens the backup and restore panel.
- After a long press, the subsequent click is suppressed so the build label does not also toggle.

## Backup Format

The backup payload is the full local database in JSON:

- `format: "benchpress-backup"`
- `version: 1`
- `exportedAt`
- `workouts`
- `exercises`

This is a snapshot format, not an event log and not a partial export.

## Backup Panel Behavior

The backup panel is a large modal with these actions:

- Load Current JSON
- Copy JSON
- Paste Clipboard
- Restore Backup

Behavior details:

- Load Current JSON reads the current database snapshot and places it in the textarea.
- Copy JSON also exports the full snapshot and attempts to place it on the clipboard.
- Paste Clipboard tries to read plain text from the clipboard into the textarea.
- Status text is shown after each action.
- Escape closes the panel only when it is not busy.

## Restore Behavior

- Restore requires non-empty JSON in the textarea.
- Restore asks for destructive confirmation through `window.confirm`.
- Import validates the JSON shape before writing.
- On success, the app replaces both tables inside one transaction.
- After import, the active workout store is reset and the log screen is refreshed.

## Validation Rules

Import rejects payloads that do not match the benchpress backup schema. Validation includes:

- backup metadata fields
- workout shape
- exercise shape
- nested blocks, sets, goals, and actuals

The import path is strict by design because a restore fully replaces local data.

## Workout Clipboard Export

Completed workout details expose a `Copy Workout` action.

The exported text format is intentionally plain:

- first line is the workout date
- each exercise becomes a line
- supersets use box-drawing prefixes to show grouped exercises
- each line contains the exercise name and a compressed set sequence

This is optimized for pasting into notes, messages, or chat.

## Related Docs

- [Log Home](../screens/log-home.md)
- [Exercise Detail](../screens/exercise-detail.md)
- [Log and Library Components](../components/log-and-library-components.md)
