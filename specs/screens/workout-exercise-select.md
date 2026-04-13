# Workout: Exercise Select

## Purpose

This screen lets the user choose an exercise to add to the active block or create a custom exercise inline.

## Layout

- search field at top
- optional `My Exercises` section
- `All Exercises` list
- custom exercise creation row at the bottom

The list area scrolls independently inside the workout shell.

## Data Requirements

On mount, the screen loads:

- the current exercise search results
- top frequent exercises, capped at 8
- last performed timestamps for exercises

## Search Behavior

- search is debounced by about 150ms
- matching is a case-insensitive name contains search
- blank query returns the full exercise library sorted by name

## Section Rules

### Not searching

- if frequent exercises exist, show `My Exercises` first
- then show `All Exercises`
- hide duplicate rows from `All Exercises` when an exercise is already present in `My Exercises`

### Searching

- flatten into one result list
- do not show the section headers

## Exercise Row Contents

Each row can show:

- exercise name
- optional muscle group
- optional last performed date on the right

Selecting a row does not add the exercise immediately. It sets the pending exercise context and moves the user into goal setting.

## Create Custom Exercise

### Collapsed state

- one row labeled `+ Create Custom Exercise`

### Expanded state

- inline text input
- `Add` button

### Submission rules

- ignore blank names
- create a new exercise with:
  - generated id
  - trimmed name
  - `isCustom: true`
- immediately treat it like a selected exercise and continue to goal setting

No duplicate-name prevention or extra metadata capture exists in the current product.

## Loading and Empty States

- loading: centered `Loading...`
- no-result state is implicit through an empty list plus the custom exercise affordance

## Related Docs

- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Workout: Goal Setting](workout-goal-setting.md)
