# Exercise History and Suggestions

## Overview

Several screens depend on derived history rather than raw CRUD:

- exercise selection
- goal setting
- in-progress working-note history
- exercise detail history

These queries should be treated as product features, not convenience helpers.

## Seeded Exercise Library

- The exercise library is seeded on first access if the exercise table is empty.
- The seed covers common lifts across chest, back, shoulders, legs, arms, compound, core, and cardio.
- Seeded exercises have `isCustom: false`.
- Custom exercises created by the user have `isCustom: true`.
- Seeded cardio machines (`Treadmill`, `Rowing Machine`, `Assault Bike`, `Stationary Bike`, `Stairmaster`, `Elliptical`) have `trackingMode: "cardio"`. All other seeded exercises have `trackingMode: "strength"`.
- Custom exercises capture `trackingMode` at creation time based on the user's selection in the picker.

## Superset Suggestions

The new-block screen surfaces up to two suggested exercises based on historical superset pairings so that common combinations like tricep pushdown alongside face pull can be added in one tap.

### Scoring

The scoring rule is strictly block-scoped. Being in the same workout but different blocks does not count — only historical supersets (multi-exercise blocks) contribute.

1. scan completed workouts only
2. inside each workout, consider finished blocks that contain more than one exercise
3. a block contributes only when at least one of its exercises is an *anchor*, meaning it already appears in the current planning block
4. for a contributing block, every other exercise in that block receives one co-occurrence point
5. sort candidates by descending co-occurrence and take the top two

Because scoring is over blocks and not workouts, an exercise that the user did in the same session as an anchor but in a separate block is not a valid suggestion on that basis alone.

### Exclusion

A candidate is filtered out if any of these hold:

- it is already an anchor
- it already appears anywhere else in the current workout, in any block status — planning, in-progress, or finished

The second rule prevents recommending an exercise the user has already scheduled or completed earlier in the same session.

When no candidate survives, the suggestion section is empty rather than falling back to generic frequency.

### Tap behavior

Tapping a suggestion is equivalent to picking that exercise from the exercise selector: it sets the pending exercise context (including its `trackingMode`) and moves directly to goal setting.

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

1. saved `nextSessionTargets` for that exercise, restricted to the current tracking mode
2. last actual performed sets from the most recent completed workout for that exercise, restricted to the current tracking mode
3. one blank set row in the current tracking mode

Because both lookups are mode-filtered, changing an exercise's tracking mode later never proposes stale metrics from the previous mode. If an exercise has history in only the other mode, the screen falls through to the blank-row case.

Proposed rows preserve a source label:

- `planned` when loaded from explicit next-session targets
- `previous` when loaded from last actuals

The UI uses that source to change the badge text and color.
Consecutive identical suggested sets stay grouped through the planning editor by increasing `amount` rather than expanding into repeated visible rows.

## Working Note History

- The in-progress exercise pane shows the two most recent non-empty working notes for the current exercise from completed workouts.
- Only finished blocks count.
- These entries are compact historical context, not editable content.

## Exercise History Entries

The exercise detail screen displays per-exercise history entries built from completed workouts.

Each entry includes:

- workout id
- workout start and completion timestamps
- exercise name at the time of the workout
- working note text
- the performed sets
- whether the block was a superset
- the names of the other exercises in that superset

This allows the detail screen to answer questions like "what did I actually do last time?" without opening full workout details.

## Related Docs

- [Workout: Exercise Select](../screens/workout-exercise-select.md)
- [Workout: Goal Setting](../screens/workout-goal-setting.md)
- [Workout: Block In Progress](../screens/workout-block-in-progress.md)
- [Exercise Detail](../screens/exercise-detail.md)
- [Notes](notes.md)
