# Data and State

## Core Entities

The persistent model has two roots: `Workout` and `Exercise`.

| Entity | Stored separately | Purpose |
| --- | --- | --- |
| `Exercise` | yes | exercise library record |
| `Workout` | yes | one workout session, including all blocks, exercises, and sets |
| `Block` | embedded in `Workout` | one single exercise or one superset group |
| `BlockExercise` | embedded in `Block` | one exercise instance inside a block |
| `ExerciseSet` | embedded in `BlockExercise` | one set with goal and actual values |

## Schema

### Exercise

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated identifier |
| `name` | string | display label |
| `isCustom` | boolean | seeded vs user-created |
| `muscleGroup` | string optional | metadata for selection UI |
| `formNotes` | string optional | exercise guidance note; edited in exercise detail and shown from the in-progress `Notes` disclosure during logging |

### Workout

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated identifier |
| `status` | `active` or `completed` | workout lifecycle |
| `startedAt` | number | unix ms |
| `completedAt` | number or `null` | set on finish |
| `notes` | string optional | legacy implementation field; not part of the intended note model |
| `blocks` | `Block[]` | ordered list |

### Block

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated identifier |
| `order` | number | 1-based within the workout |
| `status` | `planning`, `in-progress`, or `finished` | block lifecycle |
| `restTimerSeconds` | number or `null` | `null` means timer off |
| `notes` | string optional | legacy implementation field; not part of the intended note model |
| `exercises` | `BlockExercise[]` | length greater than 1 means superset |

### BlockExercise

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated identifier |
| `exerciseId` | string | foreign key to `Exercise` |
| `exerciseName` | string | denormalized for display and history stability |
| `sets` | `ExerciseSet[]` | ordered, 1-based set numbers |
| `notes` | string | working note for this exercise in this workout session |
| `nextSessionTargets` | `SetGoal[]` optional | targets to reuse later; legacy grouped values are still supported |

### ExerciseSet

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated identifier |
| `setNumber` | number | 1-based within the exercise |
| `goal` | `SetGoal` | planned reps and weight |
| `actual` | `SetActual` | completed reps and weight, nullable while unfinished |

### SetGoal

| Field | Type | Notes |
| --- | --- | --- |
| `reps` | number | non-negative integer in current UI |
| `weight` | number | pounds only |
| `amount` | number optional | grouped-count shorthand for storage compatibility, defaults to 1 |
| `isProposed` | boolean | whether the value was auto-suggested |
| `proposalSource` | `planned` or `previous` optional | suggestion origin |

### SetActual

| Field | Type | Notes |
| --- | --- | --- |
| `reps` | number or `null` | blank until recorded |
| `weight` | number or `null` | blank until recorded |

## Data Modeling Choices

- Workouts are stored as embedded documents. A rebuild should preserve this because many UI queries depend on scanning the whole workout tree at once.
- `exerciseName` is denormalized into `BlockExercise` so historical workouts remain readable even if the exercise library entry later changes or is deleted.
- Note fields are normalized to empty strings in practice. The UI assumes textareas always receive a string.
- The intended note UX centers on `Exercise.formNotes` and `BlockExercise.notes`. Workout-level and block-level note fields are currently present in code but are not part of the target note design.

## Persistent Storage

IndexedDB is the durable store. The current schema uses two tables:

| Table | Indexed fields |
| --- | --- |
| `workouts` | `id`, `status`, `startedAt` |
| `exercises` | `id`, `name`, `isCustom` |

The exercise table is seeded on first read if it is empty.

## Active Workout State

The in-memory workout session has a small UI state machine layered on top of the `Workout` document.

| Field | Purpose |
| --- | --- |
| `workout` | the active workout document or `null` |
| `currentView` | active workout subview |
| `activeBlockIndex` | selected block in the workout |
| `activeExerciseTabIndex` | selected exercise tab within the current block |
| `activeSetExerciseIndex` | exercise index that owns the highlighted active set |
| `activeSetIndex` | highlighted set within that exercise |
| `pendingExerciseId` | selected exercise while moving from picker to goal setting |
| `pendingExerciseName` | selected exercise name for goal setting |

## Store Actions and State Transitions

### Session structure

- `loadWorkout` replaces the store with a normalized workout and returns the UI to `block-list`.
- `reset` clears all session state.
- `finishWorkout` marks the workout completed in storage, then clears the session state.

### Block lifecycle

- `addBlock` appends a new planning block, inheriting the previous block's rest timer if one exists.
- `removeBlock` removes a block, reorders remaining blocks, and clamps the active block index.
- `startBlock` marks the active block `in-progress`, opens `block-in-progress`, and highlights the first incomplete set in the first exercise.
- `finishBlock` marks the block `finished` and moves to `block-finished`.

### Exercise lifecycle inside a block

- `addExerciseToBlock` appends a `BlockExercise` and returns to `new-block`.
- `removeExerciseFromBlock` deletes an exercise from the active block.
- `setPendingExercise` moves the UI into `goal-setting`.
- `setNextSessionTargets` writes next-session targets onto a `BlockExercise`.

### Set recording

- `recordActual` updates a set's `actual` values in place.
- `addSetToExercise` duplicates the last goal row and appends a blank actual row.
- `removeSetFromExercise` deletes a set, reindexes `setNumber`, and adjusts the highlighted active set if needed.
- `setActiveSet` controls which row is highlighted as the active set.
- `advanceActiveSet` uses the unfinished-set helpers to move through supersets.

## Derived Query Contracts

The persistence layer is responsible for these higher-level queries:

- load all workouts newest first
- find the active workout
- search exercises by case-insensitive name match
- return top frequent exercises based on completed-workout appearances
- return last performed dates for each exercise
- return recent actuals or next-session targets for a given exercise
- return recent exercise working notes
- return per-exercise history records for the exercise detail screen

These queries are part of the product contract, not just implementation detail, because multiple screens depend on them directly.

## Helper Algorithms Worth Preserving

### Consecutive goal grouping

Consecutive sets with the same reps, weight, proposal state, and proposal source are collapsed into one grouped `SetGoal` with `amount > 1`.

### Goal-row expansion

When grouped `SetGoal` values are loaded into an editing flow, the UI expands them into explicit one-row-per-set entries. Users change set count by adding or removing rows, not by editing `amount` directly.

### Suggested-set precedence

When building a new exercise plan:

1. use saved next-session targets if present
2. otherwise use actual values from the most recent completed session
3. otherwise start with one empty set row

### Incomplete-set detection

A set is incomplete if either `actual.reps` or `actual.weight` is `null`.

### Superset advancement

When a set is completed in a block with multiple exercises, the next active set is the first incomplete set in the next exercise that still has unfinished work. If no other exercise has unfinished work, the current exercise is used if it still has unfinished sets.

## Related Docs

- [Workout Session and Recovery](../features/workout-session-and-recovery.md)
- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Notes](../features/notes.md)
- [Workout Shell](../screens/workout-shell.md)
