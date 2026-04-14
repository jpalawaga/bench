# Exercise History and Suggestions

## Overview

Several screens depend on derived history rather than raw CRUD:

- exercise selection
- goal setting
- in-progress notes panels
- block-level note suggestions
- exercise detail history

These queries should be treated as product features, not convenience helpers.

## Seeded Exercise Library

- The exercise library is seeded on first access if the exercise table is empty.
- The seed covers common lifts across chest, back, shoulders, legs, arms, compound, core, and cardio.
- Seeded exercises have `isCustom: false`.
- Custom exercises created by the user have `isCustom: true`.

## Frequent Exercises

The exercise picker shows a "My Exercises" section when not searching.

Algorithm:

1. scan completed workouts only
2. count an exercise at most once per workout, even if it appears in multiple blocks
3. sort by descending frequency
4. return the top 8 exercises

The main alphabetical list excludes any exercise already shown in the frequent section to avoid duplicates.

## Exercise Search Matching

Exercise search is shared by the workout picker and the exercise library.

Matching rules:

- literal name fragments still match normally
- punctuation and spacing differences are ignored for matching
- common abbreviation codes are supported for many seeded lifts, such as `OHP`, `RDL`, `BSS`, and `CGBP`
- mixed shorthand using equipment abbreviations also matches, such as `db row` and `bb curl`

The matching is implemented as normalized compact-string search over the exercise name plus derived shorthand variants.

## Last Performed Date

- The exercise picker can show a small right-aligned last performed date for each exercise.
- This date is based on the most recent completed workout where the exercise appeared inside a finished block.
- The displayed date uses the workout `startedAt` timestamp.

## Goal Suggestions For New Exercises

When the user selects an exercise and enters goal setting, the app builds proposed goal rows with this precedence:

1. saved `nextSessionTargets`
2. last actual performed sets from the most recent completed workout
3. one blank set row

Proposed rows preserve a source label:

- `planned` when loaded from explicit next-session targets
- `previous` when loaded from last actuals

The UI uses that source to change the badge text and color.

## Note History

### Recent workout notes

- The block list screen loads the two most recent completed workout notes that are non-empty.

### Recent exercise notes

- The in-progress screen loads the two most recent non-empty notes for the current exercise from completed workouts.
- Only finished blocks count.

### Recent block notes

- The in-progress screen loads the two most recent non-empty block notes whose exercise set matches the current block exactly.
- Matching is order-independent. The implementation sorts exercise IDs before comparing signatures.

## Exercise History Entries

The exercise detail screen displays per-exercise history entries built from completed workouts.

Each entry includes:

- workout id
- workout start and completion timestamps
- exercise name at the time of the workout
- exercise note text
- the performed sets
- whether the block was a superset
- the names of the other exercises in that superset

This allows the detail screen to answer questions like "what did I actually do last time?" without opening full workout details.

## Related Docs

- [Workout: Exercise Select](../screens/workout-exercise-select.md)
- [Workout: Goal Setting](../screens/workout-goal-setting.md)
- [Workout: Block In Progress](../screens/workout-block-in-progress.md)
- [Exercise Detail](../screens/exercise-detail.md)
