# Data Models

Source of truth: `src/types/models.ts`

## Entity Relationships

```
Workout (1) ── embeds ──> Block (many)
Block   (1) ── embeds ──> BlockExercise (many)    [1 = single, 2+ = superset]
BlockExercise (1) ── embeds ──> ExerciseSet (many)
BlockExercise ── references ──> Exercise (by exerciseId)

Exercise — standalone table (the exercise library)
```

All relationships except Exercise lookup are embedded (denormalized). A Workout is stored as a single document in IndexedDB containing all its blocks, exercises, and sets inline.

## Schema

### Exercise (separate table)
| Field | Type | Notes |
|-------|------|-------|
| id | string (nanoid) | Primary key |
| name | string | Display name |
| isCustom | boolean | false for seed exercises, true for user-created |
| muscleGroup | string? | Optional category for filtering (e.g., "Chest", "Legs") |
| formNotes | string? | Exercise-level guidance. UI placement TBD. |

### Workout (document root)
| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| status | "active" \| "completed" | |
| startedAt | number | Unix ms |
| completedAt | number \| null | Set when finishing |
| blocks | Block[] | Embedded |

### Block
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| order | number | 1-indexed ordinal within workout |
| status | "planning" \| "in-progress" \| "finished" | |
| restTimerSeconds | number \| null | null = timer disabled |
| exercises | BlockExercise[] | length > 1 = superset |

### BlockExercise
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| exerciseId | string | FK to Exercise table |
| exerciseName | string | Denormalized for display |
| sets | ExerciseSet[] | |
| notes | string | Per-workout notes for this exercise |
| nextSessionTargets | SetGoal[]? | Optional "what I want next time" |

### ExerciseSet
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| setNumber | number | 1-indexed ordinal |
| goal | SetGoal | What the user planned |
| actual | SetActual | What the user actually did |

### SetGoal
| Field | Type | Notes |
|-------|------|-------|
| reps | number | |
| weight | number | Always lbs |
| isProposed | boolean | true when auto-populated from last session |

### SetActual
| Field | Type | Notes |
|-------|------|-------|
| reps | number \| null | null = not yet recorded |
| weight | number \| null | |

## IndexedDB Tables (Dexie)

Defined in `src/db/database.ts`:

| Table | Indexed fields | Notes |
|-------|---------------|-------|
| workouts | `id`, `status`, `startedAt` | Nested data not indexed |
| exercises | `id`, `name`, `isCustom` | Seed + custom exercises |

## Repository Interface

Defined in `src/db/repository.ts`. This is the **only** boundary between the app and persistence. All components and stores go through `WorkoutRepository`. To add a backend later, implement a new class against this interface.

Key methods:
- `saveWorkout`, `getWorkout`, `getAllWorkouts`, `deleteWorkout`, `getActiveWorkout`
- `getAllExercises`, `searchExercises`, `addExercise`
- `getFrequentExercises(limit)` — counts workout appearances per exercise, returns top N
- `getLastActuals(exerciseId)` — scans completed workouts for most recent actual sets
- `getNextSessionTargets(exerciseId)` — scans for explicitly set next-session targets
