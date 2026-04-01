# Benchpress: Phone-Based Workout Tracker PWA

## Context

The user has a spec for a workout tracking app designed for use on the gym floor. This is a greenfield project (only `spec.md` exists). The app needs to be a mobile-first browser PWA with offline support, dark mode, and large touch targets. Data starts in the browser (IndexedDB) but the architecture should allow swapping in a backend later.

## Confirmed Requirements (from spec + Q&A)

- **Storage**: IndexedDB via Dexie.js, behind a repository abstraction for future backend swap
- **PWA**: Yes — installable, offline, service worker
- **Exercise library**: Seed list (~50 common exercises) + user-created custom exercises
- **Next session targets**: Auto-prefill from last session. After block finish, optional/skippable prompt (pre-filled with old values)
- **Timer**: Countdown, tap-to-start, visual+audio alert on expiry, resets to original duration and waits
- **Log view**: View read-only details + delete. No editing past workouts.
- **Notes**: Two types — (1) exercise-level form notes/guidance (attached to Exercise entity, UI placement TBD), (2) per-exercise workout notes (text area on the in-progress screen)
- **Units**: Pounds (lbs) only
- **Visual**: Dark mode, minimal aesthetic
- **Spec typo**: Step 5 "Finish block" should be "Finish workout"

## Tech Stack

| Tool | Choice | Why |
|------|--------|-----|
| Framework | React 19 + TypeScript | Largest ecosystem, good mobile support |
| Build | Vite | Fast HMR, native TS/React/PWA plugin support |
| Styling | Tailwind CSS v4 | Utility-first, easy dark mode, great for mobile |
| State | Zustand | Lightweight (~1KB), simpler than Context for mutable state |
| Storage | Dexie.js (IndexedDB) | Clean API, good TS support, stores nested objects natively |
| IDs | nanoid | Tiny, fast, no crypto overhead |
| PWA | vite-plugin-pwa | Workbox-based service worker generation |
| Testing | Vitest + Testing Library + happy-dom + fake-indexeddb | |
| Routing | React Router v7 | Two routes: `/` (log) and `/workout/:id` |

**6 runtime deps, ~8 dev deps.** No form library, animation library, date library, or component library needed.

## Data Models

```typescript
// src/types/models.ts

type ID = string;          // nanoid
type Timestamp = number;   // Unix ms

interface Exercise {
  id: ID;
  name: string;
  isCustom: boolean;
  muscleGroup?: string;
  formNotes?: string;        // exercise-level guidance (TBD UI placement)
}

interface SetGoal {
  reps: number;
  weight: number;            // lbs
  isProposed: boolean;       // true = auto-populated from last session
}

interface SetActual {
  reps: number | null;
  weight: number | null;
}

interface ExerciseSet {
  id: ID;
  setNumber: number;
  goal: SetGoal;
  actual: SetActual;
}

interface BlockExercise {
  id: ID;
  exerciseId: ID;
  exerciseName: string;       // denormalized
  sets: ExerciseSet[];
  notes: string;              // per-workout notes for this exercise
  nextSessionTargets?: SetGoal[];
}

type BlockStatus = "planning" | "in-progress" | "finished";

interface Block {
  id: ID;
  order: number;
  status: BlockStatus;
  restTimerSeconds: number | null;
  exercises: BlockExercise[];
}

type WorkoutStatus = "active" | "completed";

interface Workout {
  id: ID;
  status: WorkoutStatus;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  blocks: Block[];
}
```

Workouts are stored as single documents in IndexedDB (blocks/exercises/sets nested inline). The only separate table is the exercise library.

## Project Structure

```
src/
  main.tsx
  App.tsx
  index.css                    # Tailwind directives + dark theme
  types/models.ts
  lib/utils.ts                 # generateId, formatDate, formatDuration, formatTimer
  db/
    database.ts                # Dexie DB class (workouts + exercises tables)
    seed.ts                    # ~50 seed exercises
    repository.ts              # WorkoutRepository interface + DexieWorkoutRepository
  stores/
    workoutStore.ts            # Zustand: active workout state + view routing
  hooks/
    useTimer.ts                # Countdown timer with drift correction
    useExercises.ts            # Search exercises via repository (debounced)
    useWorkoutHistory.ts       # Load completed workouts for log view
  pages/
    LogPage.tsx                # Home: workout history list
    WorkoutPage.tsx            # View orchestrator (switches on currentView)
    BlockListView.tsx          # Lists blocks in active workout
    NewBlockView.tsx           # Configure block: add exercises, rest timer, start
    ExerciseSelectView.tsx     # Search + select exercise (or create custom)
    GoalSettingView.tsx        # Set reps/weight/sets per exercise
    BlockInProgressView.tsx    # Timer + active exercise tabs + set recording + notes
    BlockFinishedView.tsx      # Optional next-session targets prompt
  components/
    ui/Button.tsx, Input.tsx, Modal.tsx, SearchInput.tsx, TabBar.tsx
    workout/BlockCard.tsx, ExerciseCard.tsx, SetRow.tsx, RestTimer.tsx
    log/WorkoutListItem.tsx, WorkoutDetail.tsx
```

## Architecture Decisions

**Routing**: Only 2 routes (`/` and `/workout/:id`). The workout flow sub-views are state-driven via Zustand (`currentView` field), not URL-driven. This prevents deep-linking into invalid states.

**Storage abstraction**: `WorkoutRepository` interface in `repository.ts`. All components/stores go through this. Swapping to a REST API later means implementing a new class against the same interface.

**Active workout state**: Single Zustand store holds the in-progress workout. Past workouts are read directly from the repository (no global state for read-only data). Store auto-persists to IndexedDB on mutations for crash recovery.

**Crash recovery**: On app load, check IndexedDB for a workout with `status: "active"`. If found, offer to resume.

## Implementation Plan (5 Milestones)

### Milestone 1: Foundation
Setup project, database, seed data, log page (empty state).

**Files**:
- `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`
- `src/index.css` (Tailwind + dark theme + touch target defaults)
- `src/main.tsx`, `src/App.tsx`
- `src/types/models.ts`
- `src/lib/utils.ts`
- `src/db/database.ts`, `src/db/seed.ts`, `src/db/repository.ts`
- `src/pages/LogPage.tsx`
- `src/components/log/WorkoutListItem.tsx`
- `src/components/ui/Button.tsx`

### Milestone 2: Block Setup Flow
Start workout, add blocks, select exercises, set goals.

**Files**:
- `src/stores/workoutStore.ts`
- `src/pages/WorkoutPage.tsx`, `BlockListView.tsx`, `NewBlockView.tsx`, `ExerciseSelectView.tsx`, `GoalSettingView.tsx`
- `src/components/workout/ExerciseCard.tsx`, `SetRow.tsx`, `BlockCard.tsx`
- `src/components/ui/Input.tsx`, `SearchInput.tsx`
- `src/hooks/useExercises.ts`

### Milestone 3: Block Execution
Rest timer, recording actual reps/weight, exercise notes, finish block, next-session targets prompt.

**Files**:
- `src/pages/BlockInProgressView.tsx`, `BlockFinishedView.tsx`
- `src/components/workout/RestTimer.tsx`
- `src/components/ui/TabBar.tsx`
- `src/hooks/useTimer.ts`
- `public/sounds/timer-alert.mp3`
- Update `workoutStore.ts` with `recordActual()`, `startBlock()`, `finishBlock()` actions

### Milestone 4: Complete the Loop
Finish workout, log view with details + delete, crash recovery.

**Files**:
- `src/components/log/WorkoutDetail.tsx`
- `src/components/ui/Modal.tsx` (delete confirmation)
- `src/hooks/useWorkoutHistory.ts`
- Update `LogPage.tsx` (tap for details, delete)
- Update `workoutStore.ts` with `finishWorkout()` action
- Crash recovery logic in `App.tsx`

### Milestone 5: PWA + Polish
Installable, offline, icons, iOS quirks, mobile testing.

**Files**:
- `public/manifest.json`
- `public/icons/` (192, 512, maskable)
- Finalize `vite-plugin-pwa` config
- Service worker registration in `main.tsx`
- iOS meta tags in `index.html`
- Auto-save on `visibilitychange` (iOS doesn't fire `beforeunload`)
- View transition animations (CSS only)

## Verification

After each milestone:
1. `npm run dev` — app runs, no console errors
2. Manual test the flows built in that milestone on a phone (or Chrome DevTools mobile emulation)
3. `npm run build` — production build succeeds
4. After Milestone 5: test PWA install on iOS Safari and Android Chrome, test offline mode, test timer audio
5. `npm test` — unit tests pass for repository, store actions, and timer hook
