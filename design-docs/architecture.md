# Architecture

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 19 + TypeScript | |
| Build | Vite | With `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 | Via `@tailwindcss/vite` plugin. No config file — all theming in `src/index.css` via `@theme`. |
| State | Zustand | Single store for active workout session |
| Storage | Dexie.js (IndexedDB) | Behind a repository abstraction |
| IDs | nanoid | |
| Routing | React Router v7 | HashRouter, 2 routes |
| PWA | vite-plugin-pwa | Workbox-based service worker |

6 runtime dependencies. No form library, animation library, date library, or component library.

## Project Structure

```
src/
  main.tsx                          Entry point. Mounts App, registers service worker.
  App.tsx                           HashRouter, 2 routes, crash recovery, auto-save on visibilitychange.
  index.css                         Tailwind directives, custom theme tokens, global styles.
  vite-env.d.ts                     Type declarations for Vite + PWA virtual modules.

  types/models.ts                   All TypeScript interfaces (see data-models.md).

  lib/utils.ts                      generateId, formatDate, formatDuration, formatTimerDisplay.

  db/
    database.ts                     Dexie DB class. Two tables: workouts, exercises.
    seed.ts                         ~50 seed Exercise objects.
    repository.ts                   WorkoutRepository interface + DexieWorkoutRepository.

  stores/
    workoutStore.ts                 Zustand store for the active workout session.

  hooks/
    useTimer.ts                     Countdown timer with drift correction (setInterval at 250ms).
    useExercises.ts                 Debounced exercise search via repository (150ms).
    useWorkoutHistory.ts            Loads all workouts for the log view.

  pages/
    LogPage.tsx                     Home. Workout list, detail view, delete.
    WorkoutPage.tsx                 View orchestrator. Switches on currentView from store.
    BlockListView.tsx               Lists blocks, add block, finish workout.
    NewBlockView.tsx                Configure block: exercises, rest timer slider, start.
    ExerciseSelectView.tsx          Search + select exercise. "My Exercises" + "All Exercises".
    GoalSettingView.tsx             Set goals per exercise. Pre-populates from history.
    BlockInProgressView.tsx         Timer + exercise tabs + set recording + notes.
    BlockFinishedView.tsx           Optional next-session targets prompt.

  components/
    ui/
      Button.tsx                    Variants: primary, secondary, danger. Large touch targets.
      Input.tsx                     Styled number/text input.
      Modal.tsx                     Confirmation dialog (uses <dialog>).
      SearchInput.tsx               Search with clear button, auto-focus.
      TabBar.tsx                    Horizontal tabs for superset exercises.
    workout/
      BlockCard.tsx                 Block summary card for block list.
      ExerciseCard.tsx              Exercise summary card for new block view.
      SetRow.tsx                    Goal-setting set row (reps, weight, proposed badge).
      RestTimer.tsx                 Countdown timer display with tap-to-start and audio alert.
      RestTimerSlider.tsx           Slider for rest timer duration with snap points.
    log/
      WorkoutListItem.tsx           Workout summary row for log view.
      WorkoutDetail.tsx             Read-only workout detail view.
```

## Routing

Two routes via HashRouter:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/#/` | LogPage | Workout history |
| `/#/workout/:workoutId` | WorkoutPage | Active workout (sub-views are state-driven) |

The workout flow's sub-views (block-list, new-block, exercise-select, etc.) are rendered by WorkoutPage based on `currentView` in the Zustand store. This prevents deep-linking into invalid states and keeps the URL simple.

## State Management

**Active workout** — single Zustand store (`workoutStore.ts`). Holds the full `Workout` object, the current sub-view, active block/exercise indices, and pending exercise selection. Actions mutate the workout and auto-persist to IndexedDB.

**Past workouts** — read directly from the repository via `useWorkoutHistory` hook. Not stored in global state.

**Persistence** — the store calls `repository.saveWorkout()` after every mutation. Additionally, `App.tsx` saves on `visibilitychange` (for iOS which doesn't fire `beforeunload`).

**Crash recovery** — on app load, if the route is `/`, check IndexedDB for a workout with `status: "active"`. If found, redirect to its workout page to resume.

## Storage Abstraction

`WorkoutRepository` interface in `src/db/repository.ts` is the only boundary between the app and persistence. The current implementation (`DexieWorkoutRepository`) uses IndexedDB via Dexie. To add a backend:

1. Create a new class implementing `WorkoutRepository` (e.g., `ApiWorkoutRepository`)
2. Swap the export in `repository.ts`
3. Nothing else changes
