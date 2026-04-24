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
| `formNotes` | string optional | exercise guidance note; editable from exercise detail and from the in-progress `Notes` disclosure during logging |
| `trackingMode` | `strength` or `cardio` | determines which numeric metrics the exercise uses when logging; chosen when a custom exercise is created and fixed for seeded exercises |

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
| `goal` | `SetGoal` | planned metrics; shape depends on `goal.mode` |
| `actual` | `SetActual` | recorded metrics, nullable while unfinished; `actual.mode` always matches `goal.mode` |

### SetGoal

`SetGoal` is a discriminated union keyed on `mode`. The mode of every goal inside a `BlockExercise` matches that exercise's `trackingMode` at the time it was added to the block.

Shared fields:

| Field | Type | Notes |
| --- | --- | --- |
| `mode` | `strength` or `cardio` | discriminator |
| `amount` | number optional | grouped-count shorthand, defaults to 1 |
| `isProposed` | boolean | whether the value was auto-suggested |
| `proposalSource` | `planned` or `previous` optional | suggestion origin |

Strength variant (`mode: "strength"`):

| Field | Type | Notes |
| --- | --- | --- |
| `reps` | number | non-negative integer in current UI |
| `weight` | number | pounds only |

Cardio variant (`mode: "cardio"`):

| Field | Type | Notes |
| --- | --- | --- |
| `seconds` | number | non-negative duration of the set |
| `level` | number | non-negative machine level, resistance, or intensity setting |

### SetActual

`SetActual` mirrors `SetGoal` as a discriminated union. `actual.mode` always matches `goal.mode` for the same set.

Strength variant:

| Field | Type | Notes |
| --- | --- | --- |
| `mode` | `"strength"` | discriminator |
| `reps` | number or `null` | blank until recorded |
| `weight` | number or `null` | blank until recorded |

Cardio variant:

| Field | Type | Notes |
| --- | --- | --- |
| `mode` | `"cardio"` | discriminator |
| `seconds` | number or `null` | blank until recorded |
| `level` | number or `null` | blank until recorded |

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

### Schema Versions and Migrations

The IndexedDB schema is versioned through Dexie. Each schema version ships an upgrade function that rewrites existing rows into the current shape.

| Version | Change |
| --- | --- |
| 1 | initial two-table schema |
| 2 | adds `trackingMode` on every `Exercise` and `mode` on every stored `SetGoal` and `SetActual`; legacy rows are migrated in place |

Version 2 upgrade behavior:

- every `Exercise` without `trackingMode` gains one. Names on a small known-cardio list such as `Treadmill`, `Rowing Machine`, `Assault Bike`, `Stationary Bike`, `Bike`, `Stairmaster`, and `Elliptical` migrate to `cardio`; everything else migrates to `strength`.
- every `SetGoal` without `mode` is rewritten using the inferred mode of the enclosing exercise. Strength goals keep `reps` and `weight`. Cardio goals receive `seconds` and `level` defaulted to `0` if not present.
- every `SetActual` without `mode` is rewritten the same way. Missing metrics become `null`.

Mode-aware normalization also runs on every read and on every backup import so that any record that pre-dates the migration is coerced to the new shape before it reaches the UI.

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
- `setPendingExercise` moves the UI into `goal-setting` and carries the selected exercise's `trackingMode` so the goal editor opens in the right shape.
- `setNextSessionTargets` writes next-session targets onto a `BlockExercise`.

### Set recording

- `recordActual` writes a full `SetActual` object into the chosen set. The new actual's `mode` must match the set's existing goal mode.
- `addSetToExercise` duplicates the last goal row, inheriting its mode, and appends a blank actual row in the same mode.
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
- return top superset suggestions for a set of currently-planned exercises, based on historical co-occurrence within finished multi-exercise blocks
- return recent actuals or next-session targets for a given exercise, filtered to a requested tracking mode so mode changes do not leak historical values from the old mode
- return recent exercise working notes
- return per-exercise history records for the exercise detail screen

These queries are part of the product contract, not just implementation detail, because multiple screens depend on them directly.

## Helper Algorithms Worth Preserving

### Consecutive goal grouping

Consecutive sets that share the same mode, the same numeric metrics (reps and weight for strength; seconds and level for cardio), the same proposal state, and the same proposal source are collapsed into one grouped `SetGoal` with `amount > 1`. Goals with different modes never group together.

### Goal-row expansion

When grouped `SetGoal` values are loaded into the goal-planning editors, the UI keeps them grouped as one editable row with an `amount` selector. Locking in a new block expands grouped rows into individual `ExerciseSet` records with `amount = 1`, while next-session targets can remain grouped in storage.

### Suggested-set precedence

When building a new exercise plan:

1. use saved next-session targets if present
2. otherwise use actual values from the most recent completed session
3. otherwise start with one empty set row

### Incomplete-set detection

A set is incomplete if either of its two mode-specific actual metrics is `null`. For strength that is `actual.reps` or `actual.weight`. For cardio that is `actual.seconds` or `actual.level`.

### Superset advancement

When a set is completed in a block with multiple exercises, the next active set is the first incomplete set in the next exercise that still has unfinished work. If no other exercise has unfinished work, the current exercise is used if it still has unfinished sets.

## Related Docs

- [Workout Session and Recovery](../features/workout-session-and-recovery.md)
- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Notes](../features/notes.md)
- [Workout Shell](../screens/workout-shell.md)
